import { Component, computed, inject, signal } from '@angular/core';
import { ESTADOS_PEDIDO, ETIQUETA_ESTADO } from '../core/catalogos';
import { OrdersService } from '../core/orders.service';
import { EstadoPedido, Pedido } from '../core/modelos';
import { formatearFecha, formatearNumero, formatearPrecio } from '../core/formato';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { EstadoBadgeComponent } from '../shared/estado-badge.component';

type FiltroPedido = 'todos' | EstadoPedido;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [PageHeaderComponent, EstadoBadgeComponent],
  templateUrl: './orders.component.html',
})
export class OrdersComponent {
  private readonly servicio = inject(OrdersService);
  private readonly toast = inject(ToastService);

  readonly pedidos = this.servicio.pedidos;
  readonly estados = ESTADOS_PEDIDO;
  readonly filtro = signal<FiltroPedido>('todos');

  readonly filtrados = computed(() => {
    const filtro = this.filtro();
    const lista = [...this.pedidos()].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return filtro === 'todos' ? lista : lista.filter((pedido) => pedido.estado === filtro);
  });

  contar(estado: FiltroPedido): number {
    if (estado === 'todos') return this.pedidos().length;
    return this.pedidos().filter((pedido) => pedido.estado === estado).length;
  }

  etiqueta(estado: EstadoPedido): string {
    return ETIQUETA_ESTADO[estado];
  }

  cambiarEstado(pedido: Pedido, evento: Event): void {
    const estado = (evento.target as HTMLSelectElement).value as EstadoPedido;
    if (estado === pedido.estado) return;
    this.servicio.cambiarEstado(pedido.id, estado);
    this.toast.mostrar(`El pedido ${pedido.folio} ahora está ${ETIQUETA_ESTADO[estado].toLowerCase()}.`);
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }

  formatearPrecio(valor: number): string {
    return formatearPrecio(valor);
  }

  formatearNumero(valor: number): string {
    return formatearNumero(valor);
  }
}
