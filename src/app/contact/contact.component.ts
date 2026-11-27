import { Component, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  @Input() nombreTaller = 'HILO & ESTILO';
  @Input() whatsapp = '00000000000';
  @Input() servicios: string[] = [];

  readonly enviado = signal(false);

  cliente = { nombre: '', servicio: '', mensaje: '' };
  tipoSolicitud = 'Cotización';

  get enlaceWhatsApp(): string {
    const texto = `¡Hola! Quisiera cotizar un trabajo en ${this.nombreTaller}.`;
    return `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  enviar(): void {
    const texto = [
      `¡Hola! Me gustaría solicitar una ${this.tipoSolicitud.toLowerCase()} en ${this.nombreTaller}.`,
      '',
      `Nombre: ${this.cliente.nombre.trim()}`,
      `Servicio o producto: ${this.cliente.servicio}`,
      this.cliente.mensaje.trim() ? `Detalle de la prenda: ${this.cliente.mensaje.trim()}` : '',
      '',
      '¿Podrían indicarme disponibilidad y costo estimado? Gracias.',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    this.enviado.set(true);
  }
}
