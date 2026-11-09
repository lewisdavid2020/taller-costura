import { Component, inject } from '@angular/core';
import { ToastService, TipoToast } from '../core/toast.service';

@Component({
  selector: 'app-toast-stack',
  standalone: true,
  template: `
    <div class="toast-stack" role="status" aria-live="polite" aria-atomic="false">
      @for (toast of toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast--' + toast.tipo">
          <span class="material-symbols-outlined" aria-hidden="true">{{ icono(toast.tipo) }}</span>
          <span>{{ toast.mensaje }}</span>
          <button type="button" aria-label="Cerrar notificación" (click)="cerrar(toast.id)">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastStackComponent {
  private readonly servicio = inject(ToastService);
  readonly toasts = this.servicio.toasts;

  cerrar(id: number): void {
    this.servicio.cerrar(id);
  }

  icono(tipo: TipoToast): string {
    if (tipo === 'error') return 'error';
    if (tipo === 'info') return 'info';
    return 'check_circle';
  }
}
