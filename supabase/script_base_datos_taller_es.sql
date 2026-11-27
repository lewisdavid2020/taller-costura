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
-- 8) SEGURIDAD RLS (ROW LEVEL SECURITY)
-- ============================================================
-- Activa RLS en todas las tablas expuestas.
alter table public.profiles enable row level security;
alter table public.workshop_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- PROFILES: cada administrador solo ve/edita su propio perfil
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- WORKSHOP_SETTINGS:
-- - Público (anon/authenticated) puede leer la configuración para el sitio.
-- - Solo usuarios autenticados (admin) pueden insertar/actualizar.
drop policy if exists workshop_settings_public_read on public.workshop_settings;
create policy workshop_settings_public_read on public.workshop_settings
for select
to anon, authenticated
using (true);

drop policy if exists workshop_settings_admin_update on public.workshop_settings;
create policy workshop_settings_admin_update on public.workshop_settings
for update
to authenticated
using (true)
with check (true);

drop policy if exists workshop_settings_admin_insert on public.workshop_settings;
create policy workshop_settings_admin_insert on public.workshop_settings
for insert
to authenticated
with check (true);

-- PRODUCTS:
-- - Público ve solo productos activos.
-- - Administradores autenticados pueden gestionar todo.
drop policy if exists products_public_read_active on public.products;
create policy products_public_read_active on public.products
for select
to anon, authenticated
using (estado = 'activo');

drop policy if exists products_admin_select_all on public.products;
create policy products_admin_select_all on public.products
for select
to authenticated
using (true);

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert on public.products
for insert
to authenticated
with check (true);

drop policy if exists products_admin_update on public.products;
create policy products_admin_update on public.products
for update
to authenticated
using (true)
with check (true);

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete on public.products
for delete
to authenticated
using (true);

-- ORDERS:
-- - Solo administradores autenticados pueden ver y gestionar pedidos.
-- - No se expone al público porque contiene datos de clientes.
drop policy if exists orders_admin_select on public.orders;
create policy orders_admin_select on public.orders
for select
to authenticated
using (true);

drop policy if exists orders_admin_insert on public.orders;
create policy orders_admin_insert on public.orders
for insert
to authenticated
with check (true);

drop policy if exists orders_admin_update on public.orders;
create policy orders_admin_update on public.orders
for update
to authenticated
using (true)
with check (true);

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete on public.orders
for delete
to authenticated
using (true);

-- ============================================================
-- 9) STORAGE: BUCKET PARA IMÁGENES DE PRODUCTOS
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
with check (bucket_id = 'product-images');

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update
to authenticated
using (bucket_id = 'product-images')
with check (bucket_id = 'product-images');

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images');

commit;

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================