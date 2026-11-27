-- Fase 3: políticas RLS basadas en rol admin

-- PRODUCTS
drop policy if exists products_admin_delete on public.products;
drop policy if exists products_admin_insert on public.products;
drop policy if exists products_admin_select_all on public.products;
drop policy if exists products_admin_update on public.products;
drop policy if exists products_public_read_active on public.products;

create policy products_public_read_active on public.products
for select to anon, authenticated
using (estado = 'activo'::public.product_status);

create policy products_admin_select on public.products
for select to authenticated
using (public.is_admin());

create policy products_admin_insert on public.products
for insert to authenticated
with check (public.is_admin());

create policy products_admin_update on public.products
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy products_admin_delete on public.products
for delete to authenticated
using (public.is_admin());

-- WORKSHOP_SETTINGS
drop policy if exists workshop_settings_admin_insert on public.workshop_settings;
drop policy if exists workshop_settings_admin_update on public.workshop_settings;
drop policy if exists workshop_settings_public_read on public.workshop_settings;

create policy workshop_settings_public_read on public.workshop_settings
for select to anon, authenticated
using (true);

create policy workshop_settings_admin_insert on public.workshop_settings
for insert to authenticated
with check (public.is_admin());

create policy workshop_settings_admin_update on public.workshop_settings
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy workshop_settings_admin_delete on public.workshop_settings
for delete to authenticated
using (public.is_admin());

-- ORDERS
drop policy if exists orders_admin_delete on public.orders;
drop policy if exists orders_admin_insert on public.orders;
drop policy if exists orders_admin_select on public.orders;
drop policy if exists orders_admin_update on public.orders;

create policy orders_admin_select on public.orders
for select to authenticated
using (public.is_admin());

create policy orders_admin_insert on public.orders
for insert to authenticated
with check (public.is_admin());

create policy orders_admin_update on public.orders
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy orders_admin_delete on public.orders
for delete to authenticated
using (public.is_admin());

-- SOLICITUDES_COTIZACION
drop policy if exists solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion;
drop policy if exists solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion;
drop policy if exists solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion;
drop policy if exists solicitudes_cotizacion_public_insert on public.solicitudes_cotizacion;

create policy solicitudes_cotizacion_public_insert on public.solicitudes_cotizacion
for insert to anon, authenticated
with check (true);

create policy solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion
for select to authenticated
using (public.is_admin());

create policy solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion
for delete to authenticated
using (public.is_admin());

-- PROFILES
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_select on public.profiles;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_admin_select on public.profiles
for select to authenticated
using (public.is_admin());

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- STORAGE: product-images
drop policy if exists product_images_admin_delete on storage.objects;
drop policy if exists product_images_admin_insert on storage.objects;
drop policy if exists product_images_admin_update on storage.objects;
drop policy if exists product_images_public_read on storage.objects;

create policy product_images_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

create policy product_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy product_images_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

create policy product_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
