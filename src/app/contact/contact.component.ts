import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudesService } from '../admin/core/solicitudes.service';
import { enlaceWhatsapp } from './whatsapp';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent implements OnInit {
  private readonly solicitudes = inject(SolicitudesService);
  private readonly route = inject(ActivatedRoute);

  @Input() nombreTaller = 'Julia Rosa Creaciones';
  @Input() whatsapp = '00000000000';
  @Input() servicios: string[] = [];

  readonly enviado = signal(false);
  readonly enviando = signal(false);
  readonly guardado = signal(false);
  readonly error = signal('');
  readonly intentoEnvio = signal(false);

  cliente = { nombre: '', correo: '', telefono: '', servicio: '', mensaje: '' };
  tipoSolicitud = 'Cotización';

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const servicio = params.get('servicio')?.trim();
      if (!servicio) return;
      this.cliente.servicio = servicio;
    });
  }

  get enlaceWhatsApp(): string {
    const texto = `¡Hola! Quisiera cotizar un trabajo en ${this.nombreTaller}.`;
    return `${enlaceWhatsapp(this.whatsapp)}?text=${encodeURIComponent(texto)}`;
  }

  enviar(): void {
    if (this.enviando()) return;
    this.intentoEnvio.set(true);

    const nombre = this.cliente.nombre.trim();
    const correo = this.cliente.correo.trim();
    if (!nombre || !correo || !this.cliente.servicio) {
      this.error.set('Completa tu nombre, correo y el servicio que necesitas.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      this.error.set('Escribe un correo electrónico válido para poder contactarte.');
      return;
    }

    this.error.set('');
    this.guardado.set(false);
    this.enviado.set(true);

    // Se abre dentro del gesto del usuario para que el navegador no bloquee la pestaña.
    window.open(this.construirEnlaceWhatsApp(), '_blank', 'noopener,noreferrer');

    this.enviando.set(true);
    void this.registrarSolicitud();
  }

  private async registrarSolicitud(): Promise<void> {
    const guardado = await this.solicitudes.crear({
      nombre: this.cliente.nombre,
      correo: this.cliente.correo,
      telefono: this.cliente.telefono,
      servicio: this.cliente.servicio,
      tipoSolicitud: this.tipoSolicitud,
      mensaje: this.cliente.mensaje,
    });

    this.enviando.set(false);
    this.guardado.set(guardado);
    if (!guardado) {
      this.error.set(
        'No pudimos registrar la solicitud en el panel, pero abrimos WhatsApp para que no pierdas el contacto.',
      );
    }
  }

  private construirEnlaceWhatsApp(): string {
    const texto = [
      `¡Hola! Me gustaría solicitar una ${this.tipoSolicitud.toLowerCase()} en ${this.nombreTaller}.`,
      '',
      `Nombre: ${this.cliente.nombre.trim()}`,
      `Correo: ${this.cliente.correo.trim()}`,
      this.cliente.telefono.trim() ? `Teléfono: ${this.cliente.telefono.trim()}` : '',
      `Servicio o producto: ${this.cliente.servicio}`,
      this.cliente.mensaje.trim() ? `Detalle de la prenda: ${this.cliente.mensaje.trim()}` : '',
      '',
      '¿Podrían indicarme disponibilidad y costo estimado? Gracias.',
    ]
      .filter(Boolean)
      .join('\n');

    return `${enlaceWhatsapp(this.whatsapp)}?text=${encodeURIComponent(texto)}`;
  }
}
