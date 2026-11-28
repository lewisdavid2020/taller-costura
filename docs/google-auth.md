# Acceso con Google: guía de implementación

Esta guía explica cómo dejar funcionando el **inicio de sesión con Google** y cómo implementar el **registro con Google** en este proyecto. Está pensada para que otra persona del equipo pueda retomarlo sin contexto previo.

- Proyecto Supabase: `enjcppdfxmschfwkwzpe`
- URL del proyecto: `https://enjcppdfxmschfwkwzpe.supabase.co`
- Callback de Supabase para Google: `https://enjcppdfxmschfwkwzpe.supabase.co/auth/v1/callback`
- Panel local: `http://localhost:4200/admin/login`

---

## 1. Qué ya está hecho en el código

No hay que programar el botón: ya existe y ya llama a Supabase.

| Pieza | Archivo | Qué hace |
| --- | --- | --- |
| Botón «Continuar con Google» | `src/app/admin/auth/login/login.component.html` | Llama a `entrarConGoogle()` |
| Lógica del botón | `src/app/admin/auth/login/login.component.ts` | Marca `auth-google-pendiente` en `sessionStorage`, redirige y detecta el rechazo si la cuenta no es admin |
| Llamada OAuth | `src/app/admin/core/auth.service.ts` → `iniciarSesionConGoogle()` | `signInWithOAuth({ provider: 'google', redirectTo: '/admin/login?returnUrl=...' })` |
| Verificación de rol | `src/app/admin/core/auth.service.ts` → `cargarRol()` | Consulta `public.user_roles`; si no es `admin`, cierra la sesión |
| Registro actual | `src/app/admin/auth/register/` | Correo + contraseña + código de invitación (`TALLER-2026`, hoy validado en el frontend) |
| Perfil automático | `supabase/migrations/20261127000000_init.sql` → `handle_new_user()` | Crea la fila en `public.profiles` al alta en `auth.users` |

Lo que **falta** es configuración externa (Google Cloud + Supabase) y, si se quiere alta con Google, una validación del lado del servidor.

> Importante: el panel es privado. Tener una cuenta de Google **no da acceso**. El acceso lo decide la tabla `public.user_roles` y las políticas RLS.

---

## 2. Configurar Google Cloud

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea (o selecciona) un proyecto.
2. Abre **Google Auth Platform** (antes «OAuth consent screen»):
   - **Branding**: nombre de la app, correo de soporte y logo si se quiere.
   - **Audience**: `External` para cuentas Gmail normales; `Internal` solo si todo el equipo usa Google Workspace.
   - **Data Access / Scopes**: agrega `openid`, `.../auth/userinfo.email` y `.../auth/userinfo.profile`. No hace falta nada más.
3. Ve a **Clients** → **Create OAuth client ID** → tipo **Web application**.
4. Completa:
   - **Authorized JavaScript origins**
     ```text
     http://localhost:4200
     https://tudominio.com
     ```
   - **Authorized redirect URIs**
     ```text
     https://enjcppdfxmschfwkwzpe.supabase.co/auth/v1/callback
     ```
     Debe ser exacto: sin barra final, sin comodines y sin la ruta `/admin/login`.
5. Guarda y copia el **Client ID** y el **Client Secret**.

Errores típicos en este paso:

- Poner el callback de Supabase en «JavaScript origins».
- Poner `http://localhost:4200` como redirect URI en Google (el redirect va a Supabase, no a la app).
- Usar `http` en producción: Google solo acepta `https` fuera de localhost.

---

## 3. Configurar Supabase

1. En el dashboard del proyecto, ve a **Authentication → Sign In / Providers → Google**.
2. Activa el proveedor y pega el **Client ID** y **Client Secret** de Google.
3. En esa misma pantalla Supabase muestra el **Callback URL**. Confirma que sea exactamente el que registraste en Google.
4. Ve a **Authentication → URL Configuration**:
   - **Site URL**
     ```text
     http://localhost:4200
     ```
     En producción, el dominio real.
   - **Redirect URLs** (una por línea)
     ```text
     http://localhost:4200/**
     https://tudominio.com/**
     ```
     Si prefieres ser más estricto:
     ```text
     http://localhost:4200/admin/login
     https://tudominio.com/admin/login
     ```
5. Guarda los cambios.

> El `redirectTo` que envía la app es `/admin/login` (o `/admin/registro` si se implementa la Opción B). Si esa URL no está en la lista permitida, Supabase vuelve al **Site URL** y la sesión parece «perderse».

No hay que tocar `src/environments/`: ya apunta al proyecto correcto.

---

## 4. Probar el inicio de sesión

1. `npm start`
2. Abre `http://localhost:4200/admin/login`.
3. Pulsa **«Continuar con Google»**.
4. Elige una cuenta.
5. Resultado esperado:
   - Si la cuenta tiene rol `admin` en `public.user_roles` → entra al panel.
   - Si no lo tiene → vuelve al login con el mensaje **«Tu cuenta de Google no tiene permisos de administrador.»**

Ese rechazo es intencional. La cuenta queda creada en **Authentication → Users**, pero sin permisos.

Para diagnosticar:

- **Authentication → Logs** en Supabase: errores del proveedor y del callback.
- La URL de vuelta puede traer `error` o `error_description`; el login ya muestra un mensaje genérico.
- En Google Cloud, el cliente OAuth debe quedar en estado **Enabled**.

---

## 5. Autorizar administradores (Opción A, recomendada para empezar)

Google sirve solo para **iniciar sesión** de personas ya autorizadas. El alta se hace una vez desde el SQL Editor de Supabase.

**Ver usuarios y su rol:**

```sql
select
  u.id,
  u.email,
  u.created_at,
  u.last_sign_in_at,
  r.role
from auth.users u
left join public.user_roles r on r.user_id = u.id
order by u.created_at desc;
```

**Dar rol de administrador por correo:**

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('correo@gmail.com')
on conflict (user_id) do update set role = 'admin';
```

**Quitar el rol:**

```sql
delete from public.user_roles
where user_id = (select id from auth.users where lower(email) = lower('correo@gmail.com'));
```

Después de asignar el rol, la persona debe cerrar sesión y volver a entrar (o simplemente iniciar sesión de nuevo) para que la app lo detecte.

Esta opción no requiere cambios de código y es la más segura para un equipo pequeño.

---

## 6. Registro con Google: decidir el enfoque

El registro actual pide un **código de invitación**. Google no recoge ese código, así que hay que definir cómo se autoriza la cuenta nueva.

| Opción | Cómo funciona | Trabajo | Cuándo usarla |
| --- | --- | --- | --- |
| **A. Solo login** | El admin asigna el rol por SQL | Ninguno | Equipo fijo y pequeño (recomendada ahora) |
| **B. Invitación + Edge Function** | El usuario escribe el código, entra con Google y una función del servidor valida el código y asigna el rol | Medio | Se quiere autoservicio manteniendo el registro privado |
| **C. Lista de correos permitidos** | Solo los correos de una tabla reciben el rol al entrar con Google | Medio | Se sabe de antemano qué correos pueden ser admin |
| **D. Aprobación manual en el panel** | Cualquiera entra con Google y queda «pendiente» hasta que un admin lo aprueba | Alto | Equipo cambiante y se quiere una pantalla de aprobación |

**No valides el código de invitación solo en el frontend.** El valor `TALLER-2026` está dentro del bundle de JavaScript: cualquiera puede leerlo. Para la Opción B el código debe vivir como secreto de la Edge Function.

---

## 7. Opción B: registro con Google + código de invitación

Flujo:

1. En `/admin/registro`, la persona escribe el código de invitación y pulsa **«Crear cuenta con Google»**.
2. El código se guarda temporalmente en `sessionStorage`.
3. Se lanza OAuth con `redirectTo` a `/admin/registro`.
4. Al volver, la app detecta la sesión y llama a la Edge Function `registrar-google` con el código.
5. La función verifica el JWT del usuario, compara el código con el secreto y hace `upsert` en `public.user_roles` con `service_role`.
6. Si todo va bien, entra al panel. Si el código es inválido, se cierra la sesión y se muestra el error.

### 7.1 Crear la Edge Function

Crea `supabase/functions/registrar-google/index.ts`:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1. Identificar al usuario por su JWT (no confiar en un id del body).
  const cliente = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error: errorUsuario } = await cliente.auth.getUser();
  if (errorUsuario || !user) return json({ error: 'Sesión no válida.' }, 401);

  // 2. Validar el código contra el secreto del servidor.
  const { codigo } = await req.json().catch(() => ({ codigo: '' }));
  const esperado = (Deno.env.get('CODIGO_INVITACION') ?? '').trim().toUpperCase();
  if (!esperado) return json({ error: 'Falta configurar el código de invitación.' }, 500);
  if (String(codigo ?? '').trim().toUpperCase() !== esperado) {
    return json({ error: 'El código de invitación no es válido.' }, 403);
  }

  // 3. Asignar el rol con service_role (salta RLS; nunca expongas esta clave).
  const admin = createClient(url, serviceKey);
  const { error: errorRol } = await admin
    .from('user_roles')
    .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });
  if (errorRol) return json({ error: 'No pudimos asignar el rol.' }, 500);

  return json({ ok: true });
});
```

### 7.2 Configurar el secreto y desplegar

El proyecto todavía no tiene `supabase/config.toml` ni carpeta `functions/`; se crean al vuelo.

```bash
npx supabase login
npx supabase secrets set CODIGO_INVITACION="TALLER-2026-NUEVO" --project-ref enjcppdfxmschfwkwzpe
npx supabase functions deploy registrar-google --project-ref enjcppdfxmschfwkwzpe
```

- `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente; no se configuran a mano.
- Usa un código distinto al que está en el frontend y rótalo cuando entre o salga alguien del equipo.
- No pongas el secreto en `.env` del frontend ni en el repositorio.

### 7.3 Ajustar el frontend

**a) Método OAuth para registro** en `src/app/admin/core/auth.service.ts`:

```ts
async registrarConGoogle(): Promise<ResultadoAcceso> {
  if (!this.configurado) {
    return { ok: false, error: 'Supabase no está configurado.' };
  }

  const redirectTo = new URL('/admin/registro', window.location.origin);

  const { error } = await this.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo.toString() },
  });

  if (error) {
    return { ok: false, error: 'No pudimos continuar con Google. Inténtalo de nuevo.' };
  }
  return { ok: true };
}
```

**b) Canje del código** (también en `AuthService`):

```ts
async canjearInvitacion(codigo: string): Promise<ResultadoAcceso> {
  if (!this.configurado) return { ok: false, error: 'Supabase no está configurado.' };

  const { data, error } = await this.supabase.functions.invoke('registrar-google', {
    body: { codigo },
  });

  if (error) {
    return { ok: false, error: 'No pudimos validar el código de invitación.' };
  }
  if (!data?.ok) {
    return { ok: false, error: data?.error ?? 'El código de invitación no es válido.' };
  }

  await this.cargarRol(this.sesion()?.id ?? '');
  return { ok: true };
}
```

**c) Evitar que se cierre la sesión antes del canje.** Hoy `verificarAcceso()` cierra la sesión de cualquier usuario que no sea admin. En el flujo de registro eso ocurriría antes de llamar a la función. Añade una excepción:

```ts
private async verificarAcceso(userId: string): Promise<void> {
  await this.cargarRol(userId);
  if (this.sesionActual()?.id !== userId) return;
  if (this.esAdminState()) return;

  // Registro con Google en curso: la sesión debe sobrevivir hasta canjear el código.
  if (sessionStorage.getItem('registro-google-pendiente') === '1') return;

  if (this.configurado) await this.supabase.auth.signOut();
  this.sesionActual.set(null);
  this.esAdminState.set(false);
}
```

**d) Botón en el registro.** En `register.component.ts`:

```ts
async registrarseConGoogle(): Promise<void> {
  const codigo = this.formulario.controls.codigo.value.trim();
  if (!codigo) {
    this.codigo.markAsTouched();
    this.errorCodigo.set('Escribe el código de invitación del taller.');
    return;
  }

  this.error.set('');
  this.errorCodigo.set('');
  this.cargando.set(true);

  sessionStorage.setItem('registro-google-pendiente', '1');
  sessionStorage.setItem('registro-google-codigo', codigo);

  const resultado = await this.auth.registrarConGoogle();
  this.cargando.set(false);

  if (!resultado.ok) {
    sessionStorage.removeItem('registro-google-pendiente');
    sessionStorage.removeItem('registro-google-codigo');
    this.error.set(resultado.error ?? 'No pudimos continuar con Google.');
  }
}
```

En el constructor, al volver del OAuth (agrega `effect` al import de `@angular/core`):

```ts
effect(() => {
  if (!this.auth.listo() || !this.auth.autenticado()) return;
  if (sessionStorage.getItem('registro-google-pendiente') !== '1') return;

  const codigo = sessionStorage.getItem('registro-google-codigo') ?? '';
  sessionStorage.removeItem('registro-google-codigo');

  void this.canjear(codigo);
});

private async canjear(codigo: string): Promise<void> {
  const resultado = await this.auth.canjearInvitacion(codigo);
  sessionStorage.removeItem('registro-google-pendiente');

  if (!resultado.ok) {
    await this.auth.cerrarSesion();
    this.error.set(resultado.error ?? 'No pudimos validar el código de invitación.');
    return;
  }

  this.toast.mostrar('Tu cuenta de administrador quedó lista.');
  await this.router.navigateByUrl('/admin/resumen');
}
```

**e) HTML**: agrega el botón debajo del formulario, reutilizando el estilo y el icono del botón de Google del login:

```html
<div class="auth-separador" aria-hidden="true"><span>o regístrate con</span></div>

<button
  class="adm-btn adm-btn--fantasma adm-btn--bloque"
  type="button"
  [disabled]="cargando()"
  (click)="registrarseConGoogle()">
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M21.805 10.023H12v3.955h5.627c-.243 1.3-.972 2.402-2.073 3.142v2.61h3.353c1.962-1.807 3.098-4.468 3.098-7.707 0-.744-.067-1.46-.2-2z"/>
    <path fill="#34A853" d="M12 22c2.7 0 4.965-.895 6.62-2.27l-3.353-2.61c-.928.622-2.116.99-3.267.99-2.512 0-4.64-1.696-5.4-3.975H3.13v2.695A9.996 9.996 0 0 0 12 22z"/>
    <path fill="#FBBC05" d="M6.6 14.135A6.01 6.01 0 0 1 6.287 12c0-.74.127-1.46.313-2.135V7.17H3.13A9.996 9.996 0 0 0 2 12c0 1.614.386 3.14 1.13 4.83l3.47-2.695z"/>
    <path fill="#EA4335" d="M12 5.96c1.468 0 2.787.505 3.824 1.496l2.868-2.868C16.958 2.99 14.693 2 12 2A9.996 9.996 0 0 0 3.13 7.17l3.47 2.695C7.36 7.656 9.488 5.96 12 5.96z"/>
  </svg>
  Crear cuenta con Google
</button>
```

**f) Supabase**: agrega `http://localhost:4200/admin/registro` (y el equivalente de producción) a **Redirect URLs**.

### 7.4 Consideraciones

- El código de invitación es compartido: si se filtra, cualquiera con una cuenta de Google puede hacerse admin. Rótalo o usa la Opción C.
- La función solo debe aceptar usuarios autenticados; nunca un `user_id` enviado en el body.
- Si la persona ya tenía rol, el `upsert` no rompe nada.
- Prueba primero en local y luego en producción, con el dominio agregado en Google y en Supabase.

---

## 8. Opción C: lista de correos permitidos

Útil si se sabe exactamente quién debe ser administrador y no se quiere compartir un código.

**Migración** (`supabase/migrations/20261129000000_correos_autorizados.sql`):

```sql
create table if not exists public.correos_autorizados (
  correo text primary key,
  creado_en timestamptz not null default now()
);

alter table public.correos_autorizados enable row level security;
revoke all on public.correos_autorizados from anon, authenticated;

create or replace function public.autorizar_admin_por_correo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.correos_autorizados
    where lower(correo) = lower(new.email)
  ) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id) do nothing;

    -- Un solo uso: si quieres permitir varios ingresos, omite este delete.
    delete from public.correos_autorizados
    where lower(correo) = lower(new.email);
  end if;
  return new;
end;
$$;

revoke execute on function public.autorizar_admin_por_correo() from public, anon, authenticated;

drop trigger if exists on_auth_user_autorizado on auth.users;
create trigger on_auth_user_autorizado
after insert on auth.users
for each row execute function public.autorizar_admin_por_correo();
```

**Autorizar un correo:**

```sql
insert into public.correos_autorizados (correo)
values ('persona@gmail.com')
on conflict (correo) do nothing;
```

Ventaja: el correo autorizado funciona con Google y también con correo/contraseña.
Desventaja: hay que mantener la lista; si el alta falla, el correo ya pudo haberse consumido.

---

## 9. Ajuste recomendado: nombre real desde Google

El trigger actual (`handle_new_user`) lee `raw_user_meta_data ->> 'nombre'`, pero Google envía `full_name` y `name`. Resultado: el perfil de un usuario de Google queda con la parte anterior a la `@`.

Migración opcional para corregirlo:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nombre, correo)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1),
      'Administrador'
    ),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set nombre = excluded.nombre,
        correo = excluded.correo,
        updated_at = now();
  return new;
end;
$$;
```

---

## 10. Seguridad

- El acceso real lo controlan `public.user_roles` y RLS; el frontend solo muestra u oculta pantallas.
- `service_role` solo vive en la Edge Function. Nunca en `src/environments/` ni en el repositorio.
- El código de invitación debe validarse en el servidor, no en el componente.
- En Google, el redirect URI es el callback de Supabase, no la ruta de la app.
- En Supabase, mantén la lista de **Redirect URLs** acotada a los dominios reales.
- Si en el futuro el registro deja de ser abierto, revisa **Authentication → Sign In / Providers → Email**: desactivar «Allow new users to sign up» puede afectar también el alta vía OAuth. Verifícalo en staging antes de aplicarlo en producción.
- Rota el código de invitación cuando cambie el equipo.

---

## 11. Checklist

- [ ] Proyecto creado en Google Cloud.
- [ ] Pantalla de consentimiento configurada (Audience + scopes `openid`, `email`, `profile`).
- [ ] Cliente OAuth tipo **Web application**.
- [ ] Orígenes JS: `http://localhost:4200` y el dominio de producción.
- [ ] Redirect URI: `https://enjcppdfxmschfwkwzpe.supabase.co/auth/v1/callback`.
- [ ] Proveedor Google habilitado en Supabase con Client ID y Secret.
- [ ] Site URL y Redirect URLs configuradas en Supabase.
- [ ] Login probado con una cuenta con rol `admin`.
- [ ] Rechazo probado con una cuenta sin rol.
- [ ] (Opcional) Edge Function `registrar-google` desplegada y secreto configurado.
- [ ] (Opcional) `/admin/registro` agregado a Redirect URLs.
- [ ] (Opcional) Migración de `handle_new_user` aplicada.

---

## 12. Problemas comunes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `redirect_uri_mismatch` | El callback en Google no coincide exactamente | Copia el callback desde Supabase → Providers → Google |
| «Unsupported provider: provider is not enabled» | Google no está activo en Supabase | Actívalo y guarda Client ID/Secret |
| Vuelve al login sin sesión | La URL de retorno no está permitida en Supabase | Agrégala en **Redirect URLs** |
| «Tu cuenta de Google no tiene permisos» | Falta la fila en `public.user_roles` | Asígnale el rol con el SQL de la sección 5 |
| Entra pero el nombre es raro | Google no envía `nombre` | Aplica la migración de la sección 9 |
| El registro con Google cierra la sesión antes de canjear el código | `verificarAcceso()` rechaza al no-admin | Aplica la excepción de la sección 7.3c |
| Funciona en local pero no en producción | Falta el dominio en Google o en Supabase | Agrega origen, redirect y Site URL del dominio real |

---

## 13. Archivos que se tocan

**Ya existentes (no requieren cambios para la Opción A):**

- `src/app/admin/core/auth.service.ts`
- `src/app/admin/auth/login/login.component.ts`
- `src/app/admin/auth/login/login.component.html`
- `supabase/migrations/20261127000000_init.sql`
- `supabase/migrations/20261127193000_seguridad_roles_admin.sql`

**Para la Opción B:**

- `supabase/functions/registrar-google/index.ts` (nuevo)
- `src/app/admin/core/auth.service.ts`
- `src/app/admin/auth/register/register.component.ts`
- `src/app/admin/auth/register/register.component.html`

**Para la Opción C:**

- `supabase/migrations/20261129000000_correos_autorizados.sql` (nuevo)
