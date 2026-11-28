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
  readonly pedidosVisibles = this.servicio.pedidosVisibles;
  readonly archivados = this.servicio.archivados;
  readonly estados = ESTADOS_PEDIDO;
  readonly filtro = signal<FiltroPedido>('todos');
  readonly mostrarArchivados = signal(false);

  private readonly base = computed(() =>
    this.mostrarArchivados() ? this.archivados() : this.pedidosVisibles(),
  );

  readonly filtrados = computed(() => {
    const filtro = this.filtro();
    const lista = [...this.base()].sort((a, b) => b.fecha.localeCompare(a.fecha));
    return filtro === 'todos' ? lista : lista.filter((pedido) => pedido.estado === filtro);
  });

  contar(estado: FiltroPedido): number {
    const lista = this.base();
    if (estado === 'todos') return lista.length;
    return lista.filter((pedido) => pedido.estado === estado).length;
  }

  alternarArchivados(): void {
    this.mostrarArchivados.update((valor) => !valor);
    this.filtro.set('todos');
  }

  etiqueta(estado: EstadoPedido): string {
    return ETIQUETA_ESTADO[estado];
  }

  async cambiarEstado(pedido: Pedido, evento: Event): Promise<void> {
    if (pedido.archivado) return;
    const select = evento.target as HTMLSelectElement;
    const estado = select.value as EstadoPedido;
    if (estado === pedido.estado) return;
    const ok = await this.servicio.cambiarEstado(pedido.id, estado);
    if (!ok) {
      select.value = pedido.estado;
      this.toast.mostrar('No pudimos actualizar el estado del pedido.', 'error');
      return;
    }
    this.toast.mostrar(`El pedido ${pedido.folio} ahora está ${ETIQUETA_ESTADO[estado].toLowerCase()}.`);
  }

  async eliminar(pedido: Pedido): Promise<void> {
    if (pedido.estado !== 'entregado') {
      this.toast.mostrar('Solo puedes eliminar pedidos entregados.', 'error');
      return;
    }
    if (
      !confirm(
        `¿Eliminar el pedido ${pedido.folio} de la lista? Se conservará en las métricas de ingresos.`,
      )
    ) {
      return;
    }

    const ok = await this.servicio.archivar(pedido.id);
    if (!ok) {
      this.toast.mostrar('No pudimos eliminar el pedido.', 'error');
      return;
    }
    this.toast.mostrar(`El pedido ${pedido.folio} se eliminó de la lista.`);
  }

  async restaurar(pedido: Pedido): Promise<void> {
    const ok = await this.servicio.restaurar(pedido.id);
    if (!ok) {
      this.toast.mostrar('No pudimos restaurar el pedido.', 'error');
      return;
    }
    this.toast.mostrar(`El pedido ${pedido.folio} volvió a la lista.`);
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
