-- Fase 2: privilegios mínimos
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

revoke all on public.solicitudes_cotizacion from anon, authenticated;
grant insert (nombre, correo, telefono, servicio, tipo_solicitud, mensaje)
  on public.solicitudes_cotizacion to anon;
grant select, insert, update, delete on public.solicitudes_cotizacion to authenticated;
grant all on public.solicitudes_cotizacion to service_role;
