import { Component, computed, inject, signal } from '@angular/core';
import { OrdersService } from '../core/orders.service';
import { formatearFecha, formatearPrecio, iniciales } from '../core/formato';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';

const CLAVE_OCULTOS = 'taller-clientes-ocultos';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './clients.component.html',
})
export class ClientsComponent {
  private readonly servicio = inject(OrdersService);
  private readonly toast = inject(ToastService);
  private readonly ocultos = signal<Set<string>>(this.cargarOcultos());

  readonly clientes = this.servicio.clientes;
  readonly clientesVisibles = computed(() =>
    this.clientes().filter((cliente) => !this.ocultos().has(cliente.correo)),
  );
  readonly totalOcultos = computed(() => this.clientes().length - this.clientesVisibles().length);

  iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }

  formatearPrecio(valor: number): string {
    return formatearPrecio(valor);
  }

  ocultar(correo: string): void {
    const siguiente = new Set(this.ocultos());
    siguiente.add(correo);
    this.ocultos.set(siguiente);
    this.guardarOcultos(siguiente);
  }

  limpiarLista(): void {
    const visibles = this.clientesVisibles();
    if (visibles.length === 0) return;

    if (
      !confirm(
        `¿Ocultar ${visibles.length} cliente(s) de la lista? Sus pedidos y datos no se eliminarán.`,
      )
    ) {
      return;
    }

    const siguiente = new Set(this.ocultos());
    for (const cliente of visibles) siguiente.add(cliente.correo);
    this.ocultos.set(siguiente);
    this.guardarOcultos(siguiente);
    this.toast.mostrar(`Se ocultaron ${visibles.length} cliente(s) de la lista.`);
  }

  restaurarOcultos(): void {
    this.ocultos.set(new Set());
    localStorage.removeItem(CLAVE_OCULTOS);
  }

  private cargarOcultos(): Set<string> {
    try {
      const valor = localStorage.getItem(CLAVE_OCULTOS);
      const lista = valor ? (JSON.parse(valor) as string[]) : [];
      return new Set(Array.isArray(lista) ? lista : []);
    } catch {
      return new Set();
    }
  }

  private guardarOcultos(ocultos: Set<string>): void {
    localStorage.setItem(CLAVE_OCULTOS, JSON.stringify([...ocultos]));
  }
}
