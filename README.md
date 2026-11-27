# Julia Rosa Creaciones

Sitio web y panel de administración para un taller de costura y sastrería. La página pública presenta los servicios del taller y permite solicitar una cotización; el panel privado centraliza la operación diaria: productos, pedidos, clientes y configuración.

## De qué trata el proyecto

El proyecto reúne dos experiencias en una sola aplicación:

- Un sitio público con identidad artesanal que muestra los servicios de costura, arreglos y confección, sus precios de referencia, beneficios y un espacio para solicitar cotización.
- Un panel administrativo privado para que el taller controle su catálogo, siga el avance de cada pedido y consulte la información de sus clientes.

El acceso al panel está disponible desde el encabezado del sitio público. Cuando no hay una sesión iniciada, el botón invita a iniciar sesión; cuando el administrador ya está dentro, el mismo botón cambia a Dashboard y lo lleva al resumen del panel.

## Sitio público

- Presentación del taller y su propuesta de costura y sastrería.
- Catálogo de servicios con descripción, precio de referencia, beneficios e iconografía propia.
- Llamado a la acción para solicitar una cotización.
- Sección de contacto y detalles del taller.
- Navegación adaptada a celular, tableta y escritorio.
- Botón de acceso al panel que reconoce si ya existe una sesión activa.

## Panel administrativo

El panel se organiza en las siguientes pantallas:

- Acceso: inicio de sesión y registro privado mediante invitación.
- Resumen: indicadores de ventas, pedidos activos, clientes y productos, además de gráficos de actividad y pendientes del taller.
- Productos: catálogo completo con búsqueda, filtros, disponibilidad y acceso al formulario de cada producto.
- Formulario de producto: creación y edición de datos, precios, categorías, existencias y carga de fotografías.
- Pedidos: seguimiento de todos los trabajos, filtros por estado y actualización del avance de cada pedido. Los pedidos creados desde una solicitud quedan relacionados con ella.
- Solicitudes: cotizaciones enviadas desde el formulario público, con datos de contacto, seguimiento de estado y conversión a pedido.
- Clientes: directorio con datos de contacto, número de pedidos, total entregado y último pedido.
- Configuración: información general del taller y preferencias del panel.

Dentro del panel, el botón Principal permite volver al sitio público sin cerrar la sesión. En celular, este acceso aparece también en la barra superior junto a la salida de sesión.

## Diseño y experiencia

La interfaz está completamente en español y sigue una estética de costura profesional: tonos tinta, denim, tiza, cinta métrica e hilo, texturas inspiradas en tela y detalles de sastrería. La tipografía y los componentes mantienen una jerarquía clara en todas las pantallas.

La adaptación móvil incluye menú lateral desplegable, barra superior compacta, navegación inferior, formularios en una sola columna y tablas convertidas en tarjetas para pedidos, solicitudes, clientes y productos. La sesión se conserva al moverse entre el sitio público y el panel.

## Tecnología

- Angular 21 con componentes standalone y manejo de estado reactivo.
- TypeScript para la lógica del sitio y del panel.
- CSS propio para el sistema visual y los puntos de quiebre responsive.
- Vitest para las pruebas automatizadas.
- Supabase (PostgreSQL, Auth, Storage y RLS) para la base de datos, autenticación y almacenamiento de imágenes.

## Backend con Supabase

El proyecto ya incluye la integración con Supabase:

- Cliente y configuración: `src/app/admin/core/supabase.client.ts` y `src/environments/`.
- Migración SQL: `supabase/migrations/20261127000000_init.sql`, `supabase/migrations/20261127185746_solicitudes_cotizacion.sql`, `supabase/migrations/20261127191500_relaciones_pedidos.sql`, `20261127193000_seguridad_roles_admin.sql`, `20261127193100_seguridad_privilegios_minimos.sql`, `20261127193200_seguridad_rls_admin.sql` y `20261127193300_seguridad_funciones.sql`.
- Script en español para copiar/pegar en SQL Editor: `supabase/script_base_datos_taller_es.sql`.

### Configuración rápida

1. Los archivos `src/environments/environment.ts` y `src/environments/environment.development.ts` ya apuntan al proyecto de Supabase configurado (`production: false` solo en development).
2. Si vas a usar tu propio proyecto, reemplaza `supabaseUrl` y `supabaseAnonKey` por los tuyos.
3. Ejecuta las migraciones SQL en Supabase si aún no están aplicadas.
4. Revisa en Supabase Auth la confirmación de correo según tu flujo de pruebas.
5. El contenido visible (productos, pedidos y datos del taller) sale de las tablas reales; el proyecto no inserta datos de demostración.

### Administrador por defecto para revisión

Para revisar el panel con el proyecto configurado, existe un usuario administrador creado en Supabase Auth y asignado en `public.user_roles`:

- Correo: `admin@taller.com`
- Contraseña: `Taller2026!`

> Estas credenciales son solo para revisión local/staging. Cámbialas antes de usar el proyecto en producción.

### Seguridad (RLS y roles)

- El rol administrativo se controla en la tabla `public.user_roles` (no en frontend ni en metadata editable).
- `public.is_admin()` es una función `SECURITY DEFINER` con `search_path` seguro; se usa en políticas RLS y en funciones sensibles.
- `anon` solo puede leer catálogo activo/configuración pública e insertar solicitudes por columnas del formulario.
- `authenticated` sin rol admin no tiene permisos administrativos sobre productos, pedidos, configuración, solicitudes o storage.
- `convertir_solicitud_en_pedido` exige `is_admin()` y no es ejecutable por `anon`.

### Conexión a la base de datos

**Desde la app (frontend):** usa las variables de entorno de Supabase.

```ts
export const environment = {
  production: false, // `true` únicamente en environment.ts
  supabaseUrl: 'https://TU_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'TU_ANON_KEY',
};
```

- `supabaseUrl`: la encuentras en Supabase Dashboard > Project Settings > Data API / General.
- `supabaseAnonKey`: la encuentras en Supabase Dashboard > Project Settings > API Keys (clave pública/anon). Puede estar en el repositorio; la seguridad la garantizan las políticas RLS.

**Conexión directa a PostgreSQL (opcional, para administración/migraciones):**

```text
Host: db.TU_PROJECT_REF.supabase.co
Puerto: 5432
Base de datos: postgres
Usuario: postgres
Contraseña: [la contraseña de base de datos del proyecto]
SSL: requerido
```

> Nunca publiques la clave `service_role` ni la contraseña de la base de datos. La anon key es pública por diseño.

## Estado actual

El panel y el sitio están conectados a Supabase con las credenciales incluidas en `src/environments/`. Las imágenes de productos se suben a Supabase Storage. Los listados muestran únicamente las filas existentes en la base de datos: no se generan productos, pedidos ni datos de taller de demostración.

El formulario público guarda cada cotización en `solicitudes_cotizacion` y, además, abre WhatsApp con el mensaje listo para enviar. El cliente no necesita cuenta: solo puede insertar su solicitud. El administrador las ve en `/admin/solicitudes`, puede marcarlas como contactadas o descartadas, y puede convertirlas en pedido indicando total y fecha de entrega. La conversión crea el registro en `orders`, lo relaciona con `solicitud_id` y guarda `creado_por` con el administrador autenticado.

## Pendiente

- **Inicio de sesión con Google**: agregar autenticación con cuenta de Google en el acceso del panel.
- **Gestión de clientes**: definir el comportamiento cuando un pedido pasa a estado `entregado`: eliminar el cliente relacionado, o permitir limpiar la lista/vista sin eliminar el registro del cliente.
- **Solicitudes descartadas**: permitir eliminar solicitudes cuando su estado sea `descartada`.

## Verificación

- `npm run build`: compila la aplicación para producción.
- `npm test`: ejecuta las pruebas con un cliente de Supabase simulado en memoria, sin conectarse al proyecto real ni modificar sus datos.