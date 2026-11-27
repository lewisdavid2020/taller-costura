-- Solicitudes de cotización enviadas desde el sitio público.
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
for insert to anon, authenticated
with check (true);

drop policy if exists solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_select on public.solicitudes_cotizacion
for select to authenticated
using (true);

drop policy if exists solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_update on public.solicitudes_cotizacion
for update to authenticated
using (true) with check (true);

drop policy if exists solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion;
create policy solicitudes_cotizacion_admin_delete on public.solicitudes_cotizacion
for delete to authenticated
using (true);

-- Anónimo: solo puede insertar los datos del formulario, nunca leer ni cambiar el estado.
revoke all on public.solicitudes_cotizacion from anon;
grant insert (nombre, correo, telefono, servicio, tipo_solicitud, mensaje)
  on public.solicitudes_cotizacion to anon;

revoke all on public.solicitudes_cotizacion from authenticated;
grant select, insert, update, delete on public.solicitudes_cotizacion to authenticated;
grant all on public.solicitudes_cotizacion to service_role;
