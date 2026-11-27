import { Injectable, signal } from '@angular/core';
import { supabase, supabaseConfigurado } from './supabase.client';
import { DatosTaller } from './modelos';

const DATOS_INICIALES: DatosTaller = {
  nombre: 'Julia Rosa Creaciones',
  whatsapp: '00000000000',
  direccion: 'Calle Ejemplo 123',
  horario: 'Lunes a sábado, 9:00 a 18:00',
  correo: 'hola@juliarosacreaciones.com',
};

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly datosState = signal<DatosTaller>({ ...DATOS_INICIALES });
  readonly datos = this.datosState.asReadonly();

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (!supabaseConfigurado) return;
    const { data, error } = await supabase
      .from('workshop_settings')
      .select('nombre,whatsapp,direccion,horario,correo')
      .eq('id', true)
      .maybeSingle();

    if (error || !data) return;
    this.datosState.set(this.normalizar(data));
  }

  async guardar(datos: DatosTaller): Promise<boolean> {
    const normalizados = this.normalizar(datos);
    this.datosState.set(normalizados);
    if (!supabaseConfigurado) return true;

    const { error } = await supabase
      .from('workshop_settings')
      .upsert({ id: true, ...normalizados }, { onConflict: 'id' });

    return !error;
  }

  private normalizar(datos: Partial<DatosTaller>): DatosTaller {
    return {
      nombre: typeof datos.nombre === 'string' && datos.nombre.trim() ? datos.nombre.trim() : DATOS_INICIALES.nombre,
      whatsapp: typeof datos.whatsapp === 'string' ? datos.whatsapp.trim() : DATOS_INICIALES.whatsapp,
      direccion: typeof datos.direccion === 'string' ? datos.direccion.trim() : DATOS_INICIALES.direccion,
      horario: typeof datos.horario === 'string' ? datos.horario.trim() : DATOS_INICIALES.horario,
      correo: typeof datos.correo === 'string' ? datos.correo.trim() : DATOS_INICIALES.correo,
    };
  }
}
