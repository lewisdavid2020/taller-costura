import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatearPrecio } from '../admin/core/formato';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  @Input() nombre = '';
  @Input() descripcion = '';
  @Input() categoria = '';
  @Input() precio = 0;
  @Input() imagen = '';
  @Input() numero = 1;

  get precioFormateado(): string {
    return formatearPrecio(this.precio);
  }
}
