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
- Pedidos: seguimiento de todos los trabajos, filtros por estado y actualización del avance de cada pedido.
- Clientes: directorio con datos de contacto, número de pedidos, total entregado y último pedido.
- Configuración: información general del taller y preferencias del panel.

Dentro del panel, el botón Principal permite volver al sitio público sin cerrar la sesión. En celular, este acceso aparece también en la barra superior junto a la salida de sesión.

## Diseño y experiencia

La interfaz está completamente en español y sigue una estética de costura profesional: tonos tinta, denim, tiza, cinta métrica e hilo, texturas inspiradas en tela y detalles de sastrería. La tipografía y los componentes mantienen una jerarquía clara en todas las pantallas.

La adaptación móvil incluye menú lateral desplegable, barra superior compacta, navegación inferior, formularios en una sola columna y tablas convertidas en tarjetas para pedidos, clientes y productos. La sesión se conserva al moverse entre el sitio público y el panel.

## Tecnología

- Angular 21 con componentes standalone y manejo de estado reactivo.
- TypeScript para la lógica del sitio y del panel.
- CSS propio para el sistema visual y los puntos de quiebre responsive.
- Vitest para las pruebas automatizadas.
- Supabase (PostgreSQL, Auth, Storage y RLS) para la base de datos, autenticación y almacenamiento de imágenes.

## Backend con Supabase

El proyecto ya incluye la integración con Supabase:

- Cliente y configuración: `src/app/admin/core/supabase.client.ts` y `src/environments/`.
- Migración SQL: `supabase/migrations/20261127000000_init.sql`.
- Script en español para copiar/pegar en SQL Editor: `supabase/script_base_datos_taller_es.sql`.

### Configuración rápida

1. Configura las claves en:
   - `src/environments/environment.ts`
   - `src/environments/environment.development.ts`
2. Coloca tu `supabaseUrl` y `supabaseAnonKey`.
3. Ejecuta la migración SQL en Supabase si aún no está aplicada.
4. Revisa en Supabase Auth la confirmación de correo según tu flujo de pruebas.

### Conexión a la base de datos

**Desde la app (frontend):** usa las variables de entorno de Supabase.

```ts
export const environment = {
  production: false,
  supabaseUrl: 'https://TU_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'TU_ANON_KEY',
};
```

- `supabaseUrl`: la encuentras en Supabase Dashboard > Project Settings > Data API / General.
- `supabaseAnonKey`: la encuentras en Supabase Dashboard > Project Settings > API Keys (clave pública/anon).

**Conexión directa a PostgreSQL (opcional, para administración/migraciones):**

```text
Host: db.TU_PROJECT_REF.supabase.co
Puerto: 5432
Base de datos: postgres
Usuario: postgres
Contraseña: [la contraseña de base de datos del proyecto]
SSL: requerido
```

> No publiques la `anon key` privada de servicio ni la contraseña de la base de datos en el repositorio.

## Estado actual

El panel y el sitio ya están conectados a la estructura de Supabase. Para que la conexión funcione en tu entorno, debes configurar las claves de Supabase en los archivos de environment. Las imágenes de productos se suben a Supabase Storage cuando la configuración está activa.

## Verificación

El proyecto compila correctamente para producción y cuenta con pruebas automatizadas que cubren el sitio público, el acceso, el registro, el panel, los productos, los pedidos, los clientes y la navegación responsive.