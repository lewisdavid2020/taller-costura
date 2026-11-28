import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENTE, SUPABASE_CONFIGURADO } from './supabase.client';
import { ClienteResumen, EstadoPedido, Pedido, SolicitudCotizacion } from './modelos';
import { mesCorto } from './formato';

interface PedidoFila {
  id: string;
  folio: string;
  cliente: string;
  correo: string;
  telefono: string;
  servicio: string;
  fecha: string;
  entrega: string;
  total: number | string;
  estado: EstadoPedido;
  solicitud_id?: string | null;
  creado_por?: string | null;
  archivado?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly supabase = inject(SUPABASE_CLIENTE);
  private readonly configurado = inject(SUPABASE_CONFIGURADO);
  private readonly pedidosState = signal<Pedido[]>([]);
  private readonly cargandoState = signal(false);

  readonly pedidos = this.pedidosState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly pedidosVisibles = computed(() => this.pedidosState().filter((pedido) => !pedido.archivado));
  readonly archivados = computed(() => this.pedidosState().filter((pedido) => pedido.archivado));

  readonly recientes = computed(() =>
    this.pedidosVisibles()
      .slice()
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 6),
  );

  readonly pedidosDelMes = computed(() => {
    const hoy = new Date();
    return this.pedidosState().filter((p) => this.mismoMes(new Date(p.fecha), hoy)).length;
  });

  readonly cotizacionesPendientes = computed(
    () => this.pedidosState().filter((p) => p.estado === 'pendiente').length,
  );

  readonly ingresosDelMes = computed(() => this.sumaEntregados(0));
  readonly ingresosMesAnterior = computed(() => this.sumaEntregados(1));

  readonly variacionIngresos = computed<number | null>(() => {
    const anterior = this.ingresosMesAnterior();
    if (anterior <= 0) return null;
    return Math.round(((this.ingresosDelMes() - anterior) / anterior) * 100);
  });

  readonly ventasSeisMeses = computed(() => {
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, indice) => {
      const mesesAtras = 5 - indice;
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
      const total = this.pedidosState()
        .filter((p) => p.estado === 'entregado' && this.mismoMes(new Date(p.fecha), mes))
        .reduce((suma, p) => suma + p.total, 0);
      return { etiqueta: mesCorto(mes), total, fecha: mes.toISOString() };
    });
  });

  readonly serviciosMasPedidos = computed(() => {
    const conteo = new Map<string, number>();
    for (const pedido of this.pedidosState()) {
      conteo.set(pedido.servicio, (conteo.get(pedido.servicio) ?? 0) + 1);
    }
    const total = this.pedidosState().length || 1;
    return [...conteo.entries()]
      .map(([servicio, pedidos]) => ({
        servicio,
        pedidos,
        porcentaje: Math.round((pedidos / total) * 100),
      }))
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 4);
  });

  readonly clientes = computed<ClienteResumen[]>(() => {
    const mapa = new Map<string, ClienteResumen>();
    for (const pedido of [...this.pedidosState()].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
      const actual = mapa.get(pedido.correo);
      if (actual) {
        actual.pedidos += 1;
        if (pedido.estado === 'entregado') actual.totalGastado += pedido.total;
        actual.ultimoPedido = pedido.fecha;
        continue;
      }
      mapa.set(pedido.correo, {
        nombre: pedido.cliente,
        correo: pedido.correo,
        telefono: pedido.telefono,
        pedidos: 1,
        totalGastado: pedido.estado === 'entregado' ? pedido.total : 0,
        ultimoPedido: pedido.fecha,
      });
    }
    return [...mapa.values()].sort((a, b) => b.totalGastado - a.totalGastado);
  });

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (!this.configurado) return;
    this.cargandoState.set(true);
    const { data, error } = await this.supabase
      .from('orders')
      .select('id,folio,cliente,correo,telefono,servicio,fecha,entrega,total,estado,solicitud_id,creado_por,archivado')
      .order('fecha', { ascending: false });

    this.cargandoState.set(false);
    if (error || !data) return;
    this.pedidosState.set(data.map((fila) => this.mapearPedido(fila as PedidoFila)));
  }

  async cambiarEstado(id: string, estado: EstadoPedido): Promise<boolean> {
    if (!this.configurado) return false;
    const { error } = await this.supabase.from('orders').update({ estado }).eq('id', id);
    if (error) return false;
    this.pedidosState.update((pedidos) =>
      pedidos.map((pedido) => (pedido.id === id ? { ...pedido, estado } : pedido)),
    );
    return true;
  }

  /**
   * "Elimina" un pedido entregado de la lista sin borrar el registro.
   * El pedido archivado sigue contando en las métricas de ingresos.
   */
  async archivar(id: string): Promise<boolean> {
    if (!this.configurado) return false;
    const pedido = this.pedidosState().find((item) => item.id === id);
    if (!pedido || pedido.estado !== 'entregado' || pedido.archivado) return false;

    const { error } = await this.supabase.from('orders').update({ archivado: true }).eq('id', id);
    if (error) return false;
    this.pedidosState.update((pedidos) =>
      pedidos.map((item) => (item.id === id ? { ...item, archivado: true } : item)),
    );
    return true;
  }

  async restaurar(id: string): Promise<boolean> {
    if (!this.configurado) return false;
    const { error } = await this.supabase.from('orders').update({ archivado: false }).eq('id', id);
    if (error) return false;
    this.pedidosState.update((pedidos) =>
      pedidos.map((item) => (item.id === id ? { ...item, archivado: false } : item)),
    );
    return true;
  }

  /** Crea un pedido a partir de una solicitud y las deja relacionadas. */
  async convertirSolicitud(
    solicitud: SolicitudCotizacion,
    datos: { total: number; entrega: string },
  ): Promise<Pedido | null> {
    if (!this.configurado) return null;

    const fecha = datos.entrega.includes('T')
      ? new Date(datos.entrega)
      : new Date(`${datos.entrega}T12:00:00`);
    if (Number.isNaN(fecha.getTime())) return null;

    const { data, error } = await this.supabase.rpc('convertir_solicitud_en_pedido', {
      p_solicitud_id: solicitud.id,
      p_total: datos.total,
      p_entrega: fecha.toISOString(),
    });

    if (error || !data) return null;

    const fila = Array.isArray(data) ? data[0] : data;
    if (!fila) return null;

    const pedido = this.mapearPedido(fila as PedidoFila);
    this.pedidosState.update((pedidos) => [pedido, ...pedidos]);
    return pedido;
  }

  private sumaEntregados(mesesAtras: number): number {
    const hoy = new Date();
    const mes = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
    return this.pedidosState()
      .filter((p) => p.estado === 'entregado' && this.mismoMes(new Date(p.fecha), mes))
      .reduce((suma, p) => suma + p.total, 0);
  }

  private mismoMes(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  private mapearPedido(fila: PedidoFila): Pedido {
    return {
      id: fila.id,
      folio: fila.folio,
      cliente: fila.cliente,
      correo: fila.correo,
      telefono: fila.telefono ?? '',
      servicio: fila.servicio,
      fecha: fila.fecha,
      entrega: fila.entrega,
      total: Number(fila.total),
      estado: fila.estado,
      solicitudId: fila.solicitud_id ?? undefined,
      creadoPor: fila.creado_por ?? undefined,
      archivado: Boolean(fila.archivado),
    };
  }
}