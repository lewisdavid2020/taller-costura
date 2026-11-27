-- ============================================================
-- SCRIPT DE BASE DE DATOS - HILO & ESTILO (TALLER DE COSTURA)
-- ============================================================
-- Proyecto Supabase: HILO&ESTILO PROYECTO
-- Este script crea las tablas, relaciones, índices, triggers,
-- políticas de seguridad (RLS) y bucket de imágenes.
--
-- IMPORTANTE:
-- - Los nombres de tablas/columnas se mantienen en inglés porque
--   la aplicación Angular ya está conectada con estos nombres.
-- - Puedes copiar y pegar todo este script en el SQL Editor de Supabase.
-- ============================================================

begin;

-- 1) Extensión para generación de UUIDs/funciones criptográficas
create extension if not exists pgcrypto;

-- ============================================================
-- 2) TABLA DE PERFILES (ADMINISTRADORES)
-- ============================================================
-- Guarda la información básica del administrador autenticado.
-- El id se relaciona con auth.users de Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 120),
  correo text not null unique check (position('@' in correo) > 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfiles de administradores del taller.';

-- ============================================================
-- 3) TABLA DE CONFIGURACIÓN DEL TALLER
-- ============================================================
-- Tabla de una sola fila (id=true) con los datos del taller.
create table if not exists public.workshop_settings (
  id boolean primary key default true check (id = true),
  nombre text not null default 'Nombre del Taller',
  whatsapp text not null default '00000000000',
  direccion text not null default 'Calle Ejemplo 123',
  horario text not null default 'Lunes a sábado, 9:00 a 18:00',
  correo text not null default 'hola@nombredeltaller.com',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Inserta la configuración inicial si no existe
insert into public.workshop_settings (id)
values (true)
on conflict (id) do nothing;

-- ============================================================
-- 4) TABLA DE PRODUCTOS
-- ============================================================
-- Catálogo de productos/servicios del taller.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_status') then
    create type public.product_status as enum ('activo', 'oculto');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'product_category') then
    create type public.product_category as enum ('Arreglos', 'Confección', 'Uniformes', 'Bordados', 'Accesorios');
  end if;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 3 and 80),
  descripcion text not null check (char_length(trim(descripcion)) between 20 and 600),
  categoria public.product_category not null,
  precio numeric(10,2) not null check (precio > 0),
  imagenes text[] not null default '{}'::text[],
  estado public.product_status not null default 'activo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para consultas frecuentes
create index if not exists products_estado_created_at_idx on public.products (estado, created_at desc);
create index if not exists products_categoria_idx on public.products (categoria);

-- ============================================================
-- 5) TABLA DE PEDIDOS
-- ============================================================
-- Pedidos/trabajos del taller y su estado.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pendiente', 'en proceso', 'listo', 'entregado');
  end if;
end $$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  cliente text not null check (char_length(trim(cliente)) > 0),
  correo text not null check (position('@' in correo) > 1),
  telefono text not null default '',
  servicio text not null check (char_length(trim(servicio)) > 0),
  fecha timestamptz not null default now(),
  entrega timestamptz not null,
  total numeric(10,2) not null check (total >= 0),
  estado public.order_status not null default 'pendiente',
  solicitud_id uuid,
  creado_por uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para filtros y listados
create index if not exists orders_fecha_idx on public.orders (fecha desc);
create index if not exists orders_estado_idx on public.orders (estado);
create index if not exists orders_correo_idx on public.orders (correo);

-- ============================================================
-- 6) FUNCIÓN Y TRIGGERS PARA updated_at
-- ============================================================
-- Actualiza automáticamente la fecha de modificación.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workshop_settings_updated_at on public.workshop_settings;
create trigger set_workshop_settings_updated_at
before update on public.workshop_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ============================================================
-- 7) CREACIÓN AUTOMÁTICA DE PERFIL AL REGISTRAR USUARIO
-- ============================================================
-- Cuando se crea un usuario en auth.users, se crea/actualiza su perfil.
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
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1), 'Administrador'),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set nombre = excluded.nombre,
        correo = excluded.correo,
        updated_at = now();
  return new;
end;
$$;

-- Por seguridad, se revoca ejecución pública de la función
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- 8) ROLES Y SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ============================================================
-- Modelo de roles: la tabla user_roles define quién es administrador.
-- No se confía en metadata del frontend ni en columnas editables del perfil.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

comment on table public.user_roles is 'Roles de aplicación. Solo administradores asignados por backend/migración.';

alter table public.user_roles enable row level security;

revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to service_role;

-- Bootstrap seguro: asigna admin al usuario conocido (idempotente).
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@taller.com'
on conflict (user_id) do nothing;

-- Activa RLS en todas las tablas expuestas.
alter table public.profiles enable row level security;
alter table public.workshop_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- PROFILES: cada usuario ve/edita su propio perfil; admin puede consultar perfiles.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles
for select
to authenticated
using (public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- WORKSHOP_SETTINGS:
-- - Público (anon/authenticated) puede leer la configuración.
-- - Solo administradores pueden insertar/actualizar/eliminar.
drop policy if exists workshop_settings_public_read on public.workshop_settings;
create policy workshop_settings_public_read on public.workshop_settings
for select
to anon, authenticated
using (true);

drop policy if exists workshop_settings_admin_insert on public.workshop_settings;
create policy workshop_settings_admin_insert on public.workshop_settings
for insert
to authenticated
with check (public.is_admin());

drop policy if exists workshop_settings_admin_update on public.workshop_settings;
create policy workshop_settings_admin_update on public.workshop_settings
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists workshop_settings_admin_delete on public.workshop_settings;
create policy workshop_settings_admin_delete on public.workshop_settings
for delete
to authenticated
using (public.is_admin());

-- PRODUCTS:
-- - Público ve solo productos activos.
-- - Administradores pueden gestionar todo.
drop policy if exists products_public_read_active on public.products;
create policy products_public_read_active on public.products
for select
to anon, authenticated
using (estado = 'activo');

drop policy if exists products_admin_select_all on public.products;
drop policy if exists products_admin_select on public.products;
create policy products_admin_select on public.products
for select
to authenticated
using (public.is_admin());

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products
for insert
to authenticated
with check (public.is_admin());

drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
for delete
to authenticated
using (public.is_admin());

-- ORDERS:
-- - Solo administradores pueden gestionar pedidos.
drop policy if exists orders_admin_select on public.orders;
create policy orders_admin_select on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists orders_admin_insert on public.orders;
create policy orders_admin_insert on public.orders
for insert
to authenticated
with check (public.is_admin());

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
for delete
to authenticated
using (public.is_admin());

-- ============================================================
-- 8.1) PRIVILEGIOS MÍNIMOS POR ROL
-- ============================================================
revoke all on public.orders from anon, authenticated;
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;

revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

revoke all on public.workshop_settings from anon, authenticated;
grant select on public.workshop_settings to anon, authenticated;
grant insert, update on public.workshop_settings to authenticated;
grant all on public.workshop_settings to service_role;

-- ============================================================
-- 9) SOLICITUDES DE COTIZACIÓN DEL SITIO PÚBLICO
-- ============================================================
-- El cliente no tiene cuenta: solo puede insertar su solicitud.
-- El administrador autenticado puede leerlas y cambiar su estado.
create table if not exists public.solicitudes_cotizacion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 120),
  correo text not null check (position('@' in correo) > 1),
  telefono text not null default '' check (char_length(telefono) <= 30),
  servicio text not null check (char_length(trim(servicio)) > 0),
  tipo_solicitud text not null default 'Cotización' check (char_length(trim(tipo_solicitud)) > 0),
  mensaje text not null default '' check (char_length(mensaje) <= 1000),
  estado text not null default 'nueva' check (estado in ('nueva', 'contactada', 'convertida', 'descartada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitudes_cotizacion_created_at_idx
  on public.solicitudes_cotizacion (created_at desc);
create index if not exists solicitudes_cotizacion_estado_idx
  on public.solicitudes_cotizacion (estado);

drop trigger if exists set_solicitudes_cotizacion_updated_at on public.solicitudes_cotizacion;
create trigger set_solicitudes_cotizacion_updated_at
before update on public.solicitudes_cotizacion
for each row execute function public.set_updated_at();

-- El público solo puede crear solicitudes nuevas; el estado y las fechas los fija el servidor.
create or replace function public.preparar_solicitud_cotizacion()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.estado := 'nueva';
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists preparar_solicitud_cotizacion on public.solicitudes_cotizacion;
create trigger preparar_solicitud_cotizacion
before insert on public.solicitudes_cotizacion
for each row execute function public.preparar_solicitud_cotizacion();

alter table public.solicitudes_cotizacion enable row level security;

drop policy if exists solicitudes_cotizacion_public_insert on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_public_insert on public.solicitudes_cotizacion
for insert
to anon, authenticated
with check (true);

drop policy if exists solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion
for select
to authenticated
using (public.is_admin());

drop policy if exists solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion
for delete
to authenticated
using (public.is_admin());

-- Anónimo: solo puede insertar los datos del formulario, nunca leer ni cambiar el estado.
revoke all on public.solicitudes_cotizacion from anon;
grant insert (nombre, correo, telefono, servicio, tipo_solicitud, mensaje)
  on public.solicitudes_cotizacion to anon;

revoke all on public.solicitudes_cotizacion from authenticated;
grant select, insert, update, delete on public.solicitudes_cotizacion to authenticated;
grant all on public.solicitudes_cotizacion to service_role;

-- ============================================================
-- 10) RELACIONES Y CONVERSIÓN DE SOLICITUDES A PEDIDOS
-- ============================================================
-- Relaciona los pedidos con la solicitud que los originó y con el
-- administrador que los registró.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_solicitud_id_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_solicitud_id_fkey
      foreign key (solicitud_id)
      references public.solicitudes_cotizacion(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_creado_por_fkey'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_creado_por_fkey
      foreign key (creado_por)
      references public.profiles(id)
      on delete set null;
  end if;
end $$;

-- Una cotización solo puede originar un pedido.
create unique index if not exists orders_solicitud_id_key
  on public.orders (solicitud_id)
  where solicitud_id is not null;

create index if not exists orders_creado_por_idx on public.orders (creado_por);

-- Folio automático para pedidos creados desde el panel.
create sequence if not exists public.orders_folio_seq;

create or replace function public.generar_folio_pedido()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.folio is null or trim(new.folio) = '' then
    new.folio := 'PED-' || to_char(now(), 'YYYY') || '-' ||
      lpad(nextval('public.orders_folio_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists set_orders_folio on public.orders;
create trigger set_orders_folio
before insert on public.orders
for each row execute function public.generar_folio_pedido();

grant usage, select on sequence public.orders_folio_seq to authenticated, service_role;

-- Registra automáticamente al administrador autenticado que crea el pedido.
create or replace function public.set_orders_creado_por()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.creado_por is null then
    new.creado_por := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_orders_creado_por on public.orders;
create trigger set_orders_creado_por
before insert on public.orders
for each row execute function public.set_orders_creado_por();

-- Convierte una solicitud en pedido y marca la solicitud como convertida.
-- Todo ocurre en una sola transacción. Solo administradores.
create or replace function public.convertir_solicitud_en_pedido(
  p_solicitud_id uuid,
  p_total numeric,
  p_entrega timestamptz
)
returns public.orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_solicitud public.solicitudes_cotizacion;
  v_pedido public.orders;
begin
  if not public.is_admin() then
    raise exception 'No autorizado: se requiere rol de administrador.';
  end if;

  select * into v_solicitud
  from public.solicitudes_cotizacion
  where id = p_solicitud_id
  for update;

  if not found then
    raise exception 'La solicitud no existe.';
  end if;

  if v_solicitud.estado = 'convertida' then
    raise exception 'La solicitud ya fue convertida en pedido.';
  end if;

  if p_total is null or p_total < 0 then
    raise exception 'El total debe ser mayor o igual a cero.';
  end if;

  if p_entrega is null then
    raise exception 'La fecha de entrega es obligatoria.';
  end if;

  insert into public.orders (
    cliente, correo, telefono, servicio, entrega, total, estado, solicitud_id, creado_por
  ) values (
    v_solicitud.nombre, v_solicitud.correo, v_solicitud.telefono, v_solicitud.servicio,
    p_entrega, p_total, 'pendiente', v_solicitud.id, auth.uid()
  )
  returning * into v_pedido;

  update public.solicitudes_cotizacion
  set estado = 'convertida'
  where id = v_solicitud.id;

  return v_pedido;
end;
$$;

revoke all on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) from public;
revoke all on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) from anon;
grant execute on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz)
  to authenticated, service_role;

-- ============================================================
-- 11) STORAGE: BUCKET PARA IMÁGENES DE PRODUCTOS
-- ============================================================
-- Crea bucket público para mostrar imágenes en el catálogo.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

-- Políticas de acceso a archivos del bucket
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin());

commit;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================