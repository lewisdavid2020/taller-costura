import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SolicitudesService } from './solicitudes.service';
import { proveedoresSupabaseFake } from './testing/proveedores-fake';
import { reiniciarSupabaseFake } from './testing/supabase-fake';

function crearServicio(): SolicitudesService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...proveedoresSupabaseFake(), SolicitudesService] });
  return TestBed.inject(SolicitudesService);
}

const datosSolicitud = {
  nombre: 'Carmen Rodríguez',
  correo: 'Carmen@Taller.com',
  telefono: '300 123 4567',
  servicio: 'Arreglos',
  tipoSolicitud: 'Cotización',
  mensaje: 'Necesito ajustar la basta de un pantalón.',
};

describe('SolicitudesService', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('registra una solicitud anónima y la deja disponible para el panel', async () => {
    const servicio = crearServicio();

    expect(await servicio.crear(datosSolicitud)).toBe(true);
    await servicio.cargar();

    expect(servicio.solicitudes().length).toBe(1);
    expect(servicio.solicitudes()[0].nombre).toBe('Carmen Rodríguez');
    expect(servicio.solicitudes()[0].correo).toBe('carmen@taller.com');
    expect(servicio.solicitudes()[0].estado).toBe('nueva');
    expect(servicio.nuevas()).toBe(1);
  });

  it('cambia el estado de una solicitud', async () => {
    const servicio = crearServicio();
    await servicio.crear(datosSolicitud);
    await servicio.cargar();
    const solicitud = servicio.solicitudes()[0];

    expect(await servicio.cambiarEstado(solicitud.id, 'contactada')).toBe(true);

    expect(servicio.solicitudes()[0].estado).toBe('contactada');
    expect(servicio.nuevas()).toBe(0);
  });

  it('empieza vacío cuando todavía no hay solicitudes', async () => {
    const servicio = crearServicio();

    await servicio.cargar();

    expect(servicio.solicitudes().length).toBe(0);
    expect(servicio.total()).toBe(0);
  });
});
