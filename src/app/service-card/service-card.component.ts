import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-service-card',
  standalone: true,
  templateUrl: './service-card.component.html',
})
export class ServiceCardComponent {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() precio = '';
  @Input() etiqueta = '';
  @Input() icono = 'content_cut';
  @Input() beneficios: string[] = [];
  @Input() numero = 1;
}
