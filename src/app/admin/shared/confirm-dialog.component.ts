import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <dialog #dialogo class="adm-dialog" (cancel)="cancelar($event)" (click)="alTocarFondo($event)">
      <div class="adm-dialog__caja">
        <button class="adm-dialog__cerrar" type="button" aria-label="Cerrar confirmación" (click)="cerrar()">
          <span class="material-symbols-outlined" aria-hidden="true">close</span>
        </button>
        <span class="adm-dialog__icono material-symbols-outlined" aria-hidden="true">warning</span>
        <h2>{{ titulo }}</h2>
        <p>{{ mensaje }}</p>
        <div class="adm-dialog__acciones">
          <button class="adm-btn adm-btn--fantasma" type="button" (click)="cerrar()">Cancelar</button>
          <button class="adm-btn adm-btn--peligro" type="button" (click)="confirmar()">{{ etiquetaConfirmar }}</button>
        </div>
      </div>
    </dialog>
  `,
  styles: `
    .adm-dialog {
      width: min(30rem, calc(100% - 2rem));
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--adm-tinta);
    }

    .adm-dialog::backdrop {
      background: rgb(12 19 34 / 62%);
      backdrop-filter: blur(3px);
    }

    .adm-dialog__caja {
      position: relative;
      display: grid;
      gap: 0.75rem;
      padding: 1.75rem;
      border-top: 4px solid var(--adm-hilo);
      background: var(--adm-blanco);
      box-shadow: 0 30px 80px rgb(9 16 30 / 30%);
    }

    .adm-dialog__cerrar {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: var(--adm-gris);
      cursor: pointer;
    }

    .adm-dialog__cerrar:hover { background: var(--adm-tiza); color: var(--adm-tinta); }

    .adm-dialog__icono {
      display: grid;
      width: 2.75rem;
      height: 2.75rem;
      place-items: center;
      border-radius: 50%;
      background: #fbe9e7;
      color: var(--adm-hilo);
      font-size: 1.5rem;
    }

    h2 {
      margin: 0;
      font-family: var(--adm-fuente-titulos);
      font-size: 1.35rem;
      line-height: 1.25;
    }

    p { margin: 0; color: var(--adm-gris-oscuro); line-height: 1.6; }

    .adm-dialog__acciones {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 0.5rem;
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() titulo = '¿Eliminar este registro?';
  @Input() mensaje = 'Esta acción no se puede deshacer.';
  @Input() etiquetaConfirmar = 'Eliminar';
  @Output() confirmado = new EventEmitter<void>();

  @ViewChild('dialogo', { static: true }) private dialogo!: ElementRef<HTMLDialogElement>;

  abrir(): void {
    this.dialogo.nativeElement.showModal();
  }

  cerrar(): void {
    this.dialogo.nativeElement.close();
  }

  confirmar(): void {
    this.cerrar();
    this.confirmado.emit();
  }

  cancelar(evento: Event): void {
    evento.preventDefault();
    this.cerrar();
  }

  alTocarFondo(evento: MouseEvent): void {
    if (evento.target === this.dialogo.nativeElement) this.cerrar();
  }
}
