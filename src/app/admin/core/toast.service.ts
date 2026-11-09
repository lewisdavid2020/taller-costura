import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private contador = 0;
  private readonly lista = signal<Toast[]>([]);
  readonly toasts = this.lista.asReadonly();

  mostrar(mensaje: string, tipo: TipoToast = 'exito'): void {
    this.contador += 1;
    const id = this.contador;
    this.lista.update((toasts) => [...toasts, { id, tipo, mensaje }]);
    setTimeout(() => this.cerrar(id), 4500);
  }

  cerrar(id: number): void {
    this.lista.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
