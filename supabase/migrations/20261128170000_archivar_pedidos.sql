-- Permite "eliminar" pedidos entregados de la lista sin borrar el registro.
-- El pedido archivado sigue contando en las métricas de ingresos.

alter table public.orders
  add column if not exists archivado boolean not null default false;

create index if not exists orders_archivado_idx
  on public.orders (archivado)
  where archivado;
