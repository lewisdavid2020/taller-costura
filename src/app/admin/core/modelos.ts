export interface Administrador {
  id: string;
  nombre: string;
  correo: string;
  creadoEn: string;
}

export type CategoriaProducto = 'Arreglos' | 'Confección' | 'Uniformes' | 'Bordados' | 'Accesorios';

export type EstadoProducto = 'activo' | 'oculto';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number;
  imagenes: string[];
  estado: EstadoProducto;
  creadoEn: string;
}

export type EstadoPedido = 'pendiente' | 'en proceso' | 'listo' | 'entregado';

export interface Pedido {
  id: string;
  folio: string;
  cliente: string;
  correo: string;
  telefono: string;
  servicio: string;
  fecha: string;
  entrega: string;
  total: number;
  estado: EstadoPedido;
}

export interface ClienteResumen {
  nombre: string;
  correo: string;
  telefono: string;
  pedidos: number;
  totalGastado: number;
  ultimoPedido: string;
}

export interface DatosTaller {
  nombre: string;
  whatsapp: string;
  direccion: string;
  horario: string;
  correo: string;
}

export interface ResultadoAcceso {
  ok: boolean;
  error?: string;
  campo?: 'correo' | 'contrasena' | 'codigo';
}
