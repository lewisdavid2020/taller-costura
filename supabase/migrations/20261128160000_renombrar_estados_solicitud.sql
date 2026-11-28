-- Renombra estados de solicitudes:
-- - convertida -> confirmada
-- - descartada -> cancelada

begin;

update public.solicitudes_cotizacion set estado = 'confirmada' where estado = 'convertida';
update public.solicitudes_cotizacion set estado = 'cancelada' where estado = 'descartada';

do $$
declare r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'solicitudes_cotizacion'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%estado%'
  loop
    execute format('alter table public.solicitudes_cotizacion drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.solicitudes_cotizacion
  add constraint solicitudes_cotizacion_estado_check
  check (estado in ('nueva', 'contactada', 'confirmada', 'cancelada'));

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

  if v_solicitud.estado = 'confirmada' then
    raise exception 'La solicitud ya fue confirmada en pedido.';
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
  set estado = 'confirmada'
  where id = v_solicitud.id;

  return v_pedido;
end;
$$;

revoke all on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) from public;
revoke all on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) from anon;
grant execute on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) to authenticated;
grant execute on function public.convertir_solicitud_en_pedido(uuid, numeric, timestamptz) to service_role;

commit;
