import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CLASE_SOLICITUD, ESTADOS_SOLICITUD, ETIQUETA_SOLICITUD } from '../core/catalogos';
import { formatearFecha } from '../core/formato';
import { EstadoSolicitud, SolicitudCotizacion } from '../core/modelos';
import { OrdersService } from '../core/orders.service';
import { SolicitudesService } from '../core/solicitudes.service';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';

type FiltroSolicitud = 'todas' | EstadoSolicitud;

@Component({
  selector: 'app-requests',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  templateUrl: './requests.component.html',
  styles: `
    .solicitud-mensaje {
      display: block;
      max-width: 22rem;
      color: var(--adm-gris-oscuro);
      font-size: 0.78rem;
      line-height: 1.45;
      white-space: pre-line;
    }

    .solicitud-contacto {
      display: grid;
      gap: 0.15rem;
      font-size: 0.78rem;
    }

    .solicitud-contacto a {
      color: var(--adm-hilo);
      overflow-wrap: anywhere;
    }

    .solicitud-movil {
      display: grid;
      gap: 0.7rem;
      padding: 0.95rem;
      border: 1px solid var(--adm-linea);
      border-radius: var(--adm-radio);
      background: var(--adm-blanco);
      box-shadow: var(--adm-sombra-suave);
    }

    .solicitud-movil__cabecera {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .solicitud-movil__cliente {
      margin: 0;
      color: var(--adm-tinta);
      font-family: var(--adm-fuente-texto);
      font-size: 0.92rem;
      font-weight: 700;
      letter-spacing: 0;
    }

    .solicitud-movil__servicio {
      margin: 0.15rem 0 0;
      color: var(--adm-gris);
      font-size: 0.78rem;
    }

    .solicitud-movil__datos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.55rem;
      margin: 0;
    }

    .solicitud-movil__datos div {
      display: grid;
      gap: 0.1rem;
      min-width: 0;
    }

    .solicitud-movil__datos dt {
      color: var(--adm-gris);
      font-size: 0.66rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .solicitud-movil__datos dd {
      margin: 0;
      color: var(--adm-tinta);
      font-size: 0.8rem;
      overflow-wrap: anywhere;
    }

    .solicitud-movil__estado {
      display: grid;
      gap: 0.3rem;
    }

    .solicitud-movil__estado > span {
      color: var(--adm-gris);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    @media (min-width: 901px) {
      .lista-solicitudes-movil {
        display: none;
      }
    }

    .conversion {
      display: grid;
      gap: 0.5rem;
      min-width: 14rem;
    }

    .conversion__campos {
      display: grid;
      gap: 0.45rem;
    }

    .conversion__campos label {
      display: grid;
      gap: 0.2rem;
      color: var(--adm-gris);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .conversion__acciones {
      display: flex;
      gap: 0.4rem;
      flex-wrap: wrap;
    }

    .conversion__nota {
      margin: 0;
      color: var(--adm-gris);
      font-size: 0.74rem;
    }

    @media (max-width: 900px) {
      .solicitud-tabla {
        display: none;
      }
    }
  `,
})
export class RequestsComponent {
  private readonly servicio = inject(SolicitudesService);
  private readonly pedidos = inject(OrdersService);
  private readonly toast = inject(ToastService);

  readonly solicitudes = this.servicio.solicitudes;
  readonly cargando = this.servicio.cargando;
  readonly canceladas = computed(() =>
    this.solicitudes().filter((solicitud) => solicitud.estado === 'cancelada'),
  );
  readonly estados = ESTADOS_SOLICITUD;
  readonly filtro = signal<FiltroSolicitud>('todas');
  readonly convirtiendo = signal<string | null>(null);
  readonly totalConversion = signal('');
  readonly entregaConversion = signal('');

  constructor() {
    void this.servicio.cargar();
  }

  readonly filtradas = computed(() => {
    const filtro = this.filtro();
    const lista = [...this.solicitudes()].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    return filtro === 'todas' ? lista : lista.filter((solicitud) => solicitud.estado === filtro);
  });

  readonly sinResultados = computed(
    () => this.solicitudes().length > 0 && this.filtradas().length === 0,
  );

  contar(estado: FiltroSolicitud): number {
    if (estado === 'todas') return this.solicitudes().length;
    return this.solicitudes().filter((solicitud) => solicitud.estado === estado).length;
  }

  etiqueta(estado: EstadoSolicitud): string {
    return ETIQUETA_SOLICITUD[estado];
  }

  clase(estado: EstadoSolicitud): string {
    return CLASE_SOLICITUD[estado];
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }

  enlaceWhatsApp(solicitud: SolicitudCotizacion): string {
    const digitos = solicitud.telefono.replace(/\D/g, '');
    return digitos.length >= 7 ? `https://wa.me/${digitos}` : '';
  }

  enlaceCorreo(solicitud: SolicitudCotizacion): string {
    return `mailto:${solicitud.correo}`;
  }

  recargar(): void {
    void this.servicio.cargar();
  }

  abrirConversion(solicitud: SolicitudCotizacion): void {
    this.convirtiendo.set(solicitud.id);
    this.totalConversion.set('');
    this.entregaConversion.set('');
  }

  cancelarConversion(): void {
    this.convirtiendo.set(null);
    this.totalConversion.set('');
    this.entregaConversion.set('');
  }

  puedeConvertir(solicitud: SolicitudCotizacion): boolean {
    return solicitud.estado !== 'confirmada' && solicitud.estado !== 'cancelada';
  }

  async convertir(solicitud: SolicitudCotizacion): Promise<void> {
    const total = Number(this.totalConversion());
    const entrega = this.entregaConversion();
    if (!Number.isFinite(total) || total < 0) {
      this.toast.mostrar('Ingresa un total válido para el pedido.', 'error');
      return;
    }
    if (!entrega) {
      this.toast.mostrar('Selecciona la fecha de entrega.', 'error');
      return;
    }

    const pedido = await this.pedidos.convertirSolicitud(solicitud, { total, entrega });
    if (!pedido) {
      this.toast.mostrar('No pudimos convertir la solicitud en pedido.', 'error');
      return;
    }

    this.servicio.marcarConfirmada(solicitud.id);
    this.cancelarConversion();
    this.toast.mostrar(`Se creó el pedido ${pedido.folio} para ${solicitud.nombre}.`);
  }

  async cambiarEstado(solicitud: SolicitudCotizacion, evento: Event): Promise<void> {
    const select = evento.target as HTMLSelectElement;
    const estado = select.value as EstadoSolicitud;
    if (estado === solicitud.estado) return;

    const ok = await this.servicio.cambiarEstado(solicitud.id, estado);
    if (!ok) {
      select.value = solicitud.estado;
      this.toast.mostrar('No pudimos actualizar la solicitud.', 'error');
      return;
    }

    this.toast.mostrar(
      `La solicitud de ${solicitud.nombre} ahora está ${ETIQUETA_SOLICITUD[estado].toLowerCase()}.`,
    );
  }

  async limpiarCanceladas(): Promise<void> {
    const total = this.canceladas().length;
    if (total === 0) return;

    if (
      !confirm(
        `¿Eliminar ${total} solicitud(es) cancelada(s)? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    const eliminadas = await this.servicio.eliminarCanceladas();
    if (eliminadas === 0) {
      this.toast.mostrar('No pudimos limpiar las solicitudes canceladas.', 'error');
      return;
    }

    this.toast.mostrar(`Se eliminaron ${eliminadas} solicitud(es) cancelada(s).`);
  }

  async eliminar(solicitud: SolicitudCotizacion): Promise<void> {
    if (solicitud.estado !== 'cancelada') {
      this.toast.mostrar('Solo puedes eliminar solicitudes canceladas.', 'error');
      return;
    }

    if (!confirm(`¿Eliminar la solicitud de ${solicitud.nombre}? Esta acción no se puede deshacer.`)) {
      return;
    }

    const ok = await this.servicio.eliminar(solicitud.id);
    if (!ok) {
      this.toast.mostrar('No pudimos eliminar la solicitud.', 'error');
      return;
    }

    this.toast.mostrar(`Se eliminó la solicitud de ${solicitud.nombre}.`);
  }
}
