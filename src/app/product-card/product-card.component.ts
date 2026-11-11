import { Component, Input } from '@angular/core';
import { formatearPrecio } from '../admin/core/formato';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
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
