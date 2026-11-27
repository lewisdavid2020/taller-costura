import { Injectable, computed, signal } from '@angular/core';
import { supabase, supabaseConfigurado } from './supabase.client';
import { ClienteResumen, EstadoPedido, Pedido } from './modelos';
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
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly pedidosState = signal<Pedido[]>([]);
  private readonly cargandoState = signal(false);

  readonly pedidos = this.pedidosState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();

  readonly recientes = computed(() =>
    [...this.pedidosState()]
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
    if (!supabaseConfigurado) return;
    this.cargandoState.set(true);
    const { data, error } = await supabase
      .from('orders')
      .select('id,folio,cliente,correo,telefono,servicio,fecha,entrega,total,estado')
      .order('fecha', { ascending: false });

    this.cargandoState.set(false);
    if (error || !data) return;
    this.pedidosState.set(data.map((fila) => this.mapearPedido(fila as PedidoFila)));
  }

  async cambiarEstado(id: string, estado: EstadoPedido): Promise<boolean> {
    if (!supabaseConfigurado) return false;
    const { error } = await supabase.from('orders').update({ estado }).eq('id', id);
    if (error) return false;
    this.pedidosState.update((pedidos) =>
      pedidos.map((pedido) => (pedido.id === id ? { ...pedido, estado } : pedido)),
    );
    return true;
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
    };
  }
}