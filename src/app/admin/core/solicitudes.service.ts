import { Injectable, computed, inject, signal } from '@angular/core';
import { EstadoSolicitud, SolicitudCotizacion } from './modelos';
import { SUPABASE_CLIENTE, SUPABASE_CONFIGURADO } from './supabase.client';

interface SolicitudFila {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  servicio: string;
  tipo_solicitud: string;
  mensaje: string | null;
  estado: EstadoSolicitud;
  created_at: string;
}

export interface NuevaSolicitud {
  nombre: string;
  correo: string;
  telefono: string;
  servicio: string;
  tipoSolicitud: string;
  mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly supabase = inject(SUPABASE_CLIENTE);
  private readonly configurado = inject(SUPABASE_CONFIGURADO);

  private readonly solicitudesState = signal<SolicitudCotizacion[]>([]);
  private readonly cargandoState = signal(false);

  readonly solicitudes = this.solicitudesState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly total = computed(() => this.solicitudesState().length);
  readonly nuevas = computed(() => this.solicitudesState().filter((s) => s.estado === 'nueva').length);

  async cargar(): Promise<void> {
    if (!this.configurado) return;
    this.cargandoState.set(true);
    const { data, error } = await this.supabase
      .from('solicitudes_cotizacion')
      .select('id,nombre,correo,telefono,servicio,tipo_solicitud,mensaje,estado,created_at')
      .order('created_at', { ascending: false });

    this.cargandoState.set(false);
    if (error || !data) return;
    this.solicitudesState.set(data.map((fila) => this.mapearSolicitud(fila as SolicitudFila)));
  }

  /** Lo usa el formulario público; no requiere sesión. */
  async crear(datos: NuevaSolicitud): Promise<boolean> {
    if (!this.configurado) return false;
    const { error } = await this.supabase.from('solicitudes_cotizacion').insert({
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim().toLowerCase(),
      telefono: datos.telefono.trim(),
      servicio: datos.servicio.trim(),
      tipo_solicitud: datos.tipoSolicitud.trim(),
      mensaje: datos.mensaje.trim(),
    });

    return !error;
  }

  async cambiarEstado(id: string, estado: EstadoSolicitud): Promise<boolean> {
    if (!this.configurado) return false;
    const { error } = await this.supabase
      .from('solicitudes_cotizacion')
      .update({ estado })
      .eq('id', id);

    if (error) return false;
    this.solicitudesState.update((solicitudes) =>
      solicitudes.map((solicitud) => (solicitud.id === id ? { ...solicitud, estado } : solicitud)),
    );
    return true;
  }

  async eliminar(id: string): Promise<boolean> {
    if (!this.configurado) return false;
    const { error } = await this.supabase.from('solicitudes_cotizacion').delete().eq('id', id);

    if (error) return false;
    this.solicitudesState.update((solicitudes) => solicitudes.filter((solicitud) => solicitud.id !== id));
    return true;
  }

  /** Elimina todas las solicitudes canceladas de la lista. */
  async eliminarCanceladas(): Promise<number> {
    if (!this.configurado) return 0;
    const total = this.solicitudesState().filter(
      (solicitud) => solicitud.estado === 'cancelada',
    ).length;
    if (total === 0) return 0;

    const { error } = await this.supabase
      .from('solicitudes_cotizacion')
      .delete()
      .eq('estado', 'cancelada');

    if (error) return 0;
    this.solicitudesState.update((solicitudes) =>
      solicitudes.filter((solicitud) => solicitud.estado !== 'cancelada'),
    );
    return total;
  }

  marcarConfirmada(id: string): void {
    this.solicitudesState.update((solicitudes) =>
      solicitudes.map((solicitud) =>
        solicitud.id === id ? { ...solicitud, estado: 'confirmada' } : solicitud,
      ),
    );
  }

  private mapearSolicitud(fila: SolicitudFila): SolicitudCotizacion {
    return {
      id: fila.id,
      nombre: fila.nombre,
      correo: fila.correo,
      telefono: fila.telefono ?? '',
      servicio: fila.servicio,
      tipoSolicitud: fila.tipo_solicitud,
      mensaje: fila.mensaje ?? '',
      estado: fila.estado,
      creadoEn: fila.created_at,
    };
  }
}
