import { Injectable, signal } from '@angular/core';
import { DatosTaller } from './modelos';

const CLAVE_TALLER = 'taller.admin.datos.v1';

const NOMBRES_ANTERIORES = ['Nombre del Taller', 'Taller de Costura', 'taller de costura'];

const DATOS_INICIALES: DatosTaller = {
  nombre: 'HILO & ESTILO',
  whatsapp: '00000000000',
  horario: 'Lunes a sábado, 9:00 a 18:00',
  correo: 'hola@hiloestilo.com',
};

@Injectable({ providedIn: 'root' })
export class WorkshopService {
  private readonly datosState = signal<DatosTaller>(this.leer());
  readonly datos = this.datosState.asReadonly();

  guardar(datos: DatosTaller): void {
    this.datosState.set(datos);
    try {
      localStorage.setItem(CLAVE_TALLER, JSON.stringify(datos));
    } catch {
      // La configuración se conserva en memoria si el almacenamiento no está disponible.
    }
  }

  private leer(): DatosTaller {
    try {
      const crudo = localStorage.getItem(CLAVE_TALLER);
      if (!crudo) return { ...DATOS_INICIALES };
      const datos = JSON.parse(crudo) as Partial<DatosTaller>;
      const nombreGuardado = typeof datos.nombre === 'string' ? datos.nombre.trim() : '';
      const nombre =
        nombreGuardado && !NOMBRES_ANTERIORES.includes(nombreGuardado) ? datos.nombre! : DATOS_INICIALES.nombre;
      return {
        nombre,
        whatsapp: typeof datos.whatsapp === 'string' ? datos.whatsapp : DATOS_INICIALES.whatsapp,
        horario: typeof datos.horario === 'string' ? datos.horario : DATOS_INICIALES.horario,
        correo: typeof datos.correo === 'string' ? datos.correo : DATOS_INICIALES.correo,
      };
    } catch {
      return { ...DATOS_INICIALES };
    }
  }
}
