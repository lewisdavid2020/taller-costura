# Taller de Costura

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

- Angular 22 con componentes standalone y manejo de estado reactivo.
- TypeScript para la lógica del sitio y del panel.
- CSS propio para el sistema visual y los puntos de quiebre responsive.
- Vitest para las pruebas automatizadas.
- Almacenamiento local del navegador para la demostración de usuarios, productos, pedidos y configuración.

## Estado actual

Se trata de una demostración funcional. Los datos se guardan en el navegador del equipo donde se usa el panel, por lo que no se comparten todavía entre dispositivos ni usuarios. Las contraseñas se almacenan con hash y el registro requiere una invitación privada.

El siguiente paso recomendado es conectar el panel a una base de datos real. La opción sugerida es Supabase con PostgreSQL, autenticación y almacenamiento de imágenes; PocketBase con SQLite es una alternativa sencilla para un taller pequeño con pocos administradores.

## Verificación

El proyecto compila correctamente para producción y cuenta con pruebas automatizadas que cubren el sitio público, el acceso, el registro, el panel, los productos, los pedidos, los clientes y la navegación responsive.
