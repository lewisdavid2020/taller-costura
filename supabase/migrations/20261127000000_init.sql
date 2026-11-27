-- Inicialización backend Taller de Costura (Supabase/Postgres)
-- Aplica este script en el SQL Editor de Supabase o mediante Supabase CLI.

begin;

-- Extensiones útiles
create extension if not exists pgcrypto;

-- =========================
-- Perfiles de administrador
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 120),
  correo text not null unique check (position('@' in correo) > 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfiles de administradores del taller.';

-- =========================
-- Configuración del taller
-- =========================
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

insert into public.workshop_settings (id)
values (true)
on conflict (id) do nothing;

-- =========================
-- Productos
-- =========================
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

create index if not exists products_estado_created_at_idx on public.products (estado, created_at desc);
create index if not exists products_categoria_idx on public.products (categoria);

-- =========================
-- Pedidos
-- =========================
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

create index if not exists orders_fecha_idx on public.orders (fecha desc);
create index if not exists orders_estado_idx on public.orders (estado);
create index if not exists orders_correo_idx on public.orders (correo);

-- =========================
-- Timestamp updated_at
-- =========================
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

-- =========================
-- Perfil automático al registrarse
-- =========================
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- =========================
-- RLS
-- =========================
alter table public.profiles enable row level security;
alter table public.workshop_settings enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

-- Profiles: cada admin ve/edita su propio perfil
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

-- Workshop settings: público puede leer; admins autenticados pueden actualizar
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

-- Products: público ve activos; admins gestionan todo
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

-- Orders: solo admins autenticados (contienen datos de clientes)
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

-- =========================
-- Storage: imágenes de productos
-- =========================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

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