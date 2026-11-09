import { Component, inject } from '@angular/core';
import { OrdersService } from '../core/orders.service';
import { formatearFecha, formatearPrecio, iniciales } from '../core/formato';
import { PageHeaderComponent } from '../shared/page-header.component';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './clients.component.html',
})
export class ClientsComponent {
  private readonly servicio = inject(OrdersService);

  readonly clientes = this.servicio.clientes;

  iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }

  formatearPrecio(valor: number): string {
    return formatearPrecio(valor);
  }
}
