-- Relaciones del flujo de pedidos:
-- - orders.solicitud_id -> solicitudes_cotizacion (cotización que originó el pedido)
-- - orders.creado_por   -> profiles (administrador que registró el pedido)
-- También genera el folio automáticamente y expone una función atómica
-- para convertir una solicitud en pedido.

alter table public.orders
  add column if not exists solicitud_id uuid,
  add column if not exists creado_por uuid;

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
-- Todo ocurre en una sola transacción: si falla el pedido, la solicitud no cambia.
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
  if auth.uid() is null then
    raise exception 'Se requiere una sesión de administrador.';
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
grant execute on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz)
  to authenticated, service_role;
