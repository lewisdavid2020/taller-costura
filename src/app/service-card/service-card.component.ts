import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-service-card',
  standalone: true,
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.css',
})
export class ServiceCardComponent {
  @Input() titulo = '';
  @Input() descripcion = '';
  @Input() precio = '';
  @Input() numero = 1;
  @Input() etiqueta = '';
  @Input() icono = 'content_cut';
  @Input() beneficios: string[] = [];
}
