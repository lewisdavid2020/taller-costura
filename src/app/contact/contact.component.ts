import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css',
})
export class ContactComponent {
  // Los 3 llegan desde AppComponent
  @Input() nombreTaller = 'Nombre del Taller';
  @Input() whatsapp = '00000000000';
  @Input() servicios: string[] = [];

  cliente = { nombre: '', servicio: '', mensaje: '' };

  // No hay backend: se arma el mensaje y se abre WhatsApp con el texto ya escrito.
  enviar(): void {
    const texto = [
      `¡Hola! Me gustaría cotizar un trabajo en ${this.nombreTaller}.`,
      '',
      `Nombre: ${this.cliente.nombre.trim()}`,
      `Servicio o producto solicitado: ${this.cliente.servicio}`,
      this.cliente.mensaje.trim() ? `Detalle de la prenda: ${this.cliente.mensaje.trim()}` : '',
      '',
      '¿Podrían indicarme disponibilidad y costo estimado? Gracias.',
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/${this.whatsapp}?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
