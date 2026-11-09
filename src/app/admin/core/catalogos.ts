import { CategoriaProducto, EstadoPedido, EstadoProducto } from './modelos';

export const CATEGORIAS_PRODUCTO: CategoriaProducto[] = [
  'Arreglos',
  'Confección',
  'Uniformes',
  'Bordados',
  'Accesorios',
];

export const ESTADOS_PRODUCTO: Array<{ valor: EstadoProducto; etiqueta: string }> = [
  { valor: 'activo', etiqueta: 'Activo' },
  { valor: 'oculto', etiqueta: 'Oculto' },
];

export const ESTADOS_PEDIDO: EstadoPedido[] = ['pendiente', 'en proceso', 'listo', 'entregado'];

export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  'en proceso': 'En proceso',
  listo: 'Listo',
  entregado: 'Entregado',
};

export const CLASE_ESTADO: Record<EstadoPedido, string> = {
  pendiente: 'estado--pendiente',
  'en proceso': 'estado--proceso',
  listo: 'estado--listo',
  entregado: 'estado--entregado',
};

export const ICONO_CATEGORIA: Record<CategoriaProducto, string> = {
  Arreglos: 'content_cut',
  Confección: 'checkroom',
  Uniformes: 'groups',
  Bordados: 'gesture',
  Accesorios: 'shopping_bag',
};
