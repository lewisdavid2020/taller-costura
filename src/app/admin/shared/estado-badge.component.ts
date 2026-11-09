import { Component, Input } from '@angular/core';
import { EstadoPedido } from '../core/modelos';
import { CLASE_ESTADO, ETIQUETA_ESTADO } from '../core/catalogos';

@Component({
  selector: 'app-estado-badge',
  standalone: true,
  template: `<span [class]="'estado ' + clase">{{ etiqueta }}</span>`,
  styles: `
    .estado {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.28rem 0.6rem;
      border: 1px solid transparent;
      border-radius: 999px;
      font: 700 0.66rem var(--adm-fuente-datos);
      letter-spacing: 0.05em;
      line-height: 1.2;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .estado::before {
      width: 0.42rem;
      height: 0.42rem;
      border-radius: 50%;
      background: currentColor;
      content: '';
    }

    .estado--pendiente { border-color: #e2b62c; background: #fdf4d7; color: #745a00; }
    .estado--proceso { border-color: #27406b; background: #e8edf7; color: #27406b; }
    .estado--listo { border-color: #2f6b52; background: #e5f0ea; color: #255643; }
    .estado--entregado { border-color: #c8d0dc; background: #f1f4f8; color: #5b677d; }
  `,
})
export class EstadoBadgeComponent {
  @Input({ required: true }) estado!: EstadoPedido;

  get clase(): string {
    return CLASE_ESTADO[this.estado];
  }

  get etiqueta(): string {
    return ETIQUETA_ESTADO[this.estado];
  }
}
