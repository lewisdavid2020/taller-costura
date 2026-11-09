import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

const CLAVE_SESION = 'taller.admin.sesion.v1';

function crearServicio(): AuthService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [AuthService] });
  return TestBed.inject(AuthService);
}

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('rechaza un código de invitación inválido', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.registrar({
      nombre: 'Carmen Rodríguez',
      correo: 'carmen@taller.com',
      contrasena: 'Taller2026!',
      codigo: 'CODIGO-MALO',
    });

    expect(resultado.ok).toBe(false);
    expect(resultado.campo).toBe('codigo');
    expect(servicio.autenticado()).toBe(false);
  });

  it('registra, abre sesión y persiste al administrador', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.registrar({
      nombre: 'Carmen Rodríguez',
      correo: 'Carmen@Taller.com',
      contrasena: 'Taller2026!',
      codigo: 'taller-2026',
    });

    expect(resultado.ok).toBe(true);
    expect(servicio.autenticado()).toBe(true);
    expect(servicio.sesion()?.correo).toBe('carmen@taller.com');
    expect(localStorage.getItem(CLAVE_SESION)).toContain('carmen@taller.com');
  });

  it('impide registrar dos veces el mismo correo', async () => {
    const servicio = crearServicio();
    const datos = {
      nombre: 'Carmen Rodríguez',
      correo: 'carmen@taller.com',
      contrasena: 'Taller2026!',
      codigo: 'TALLER-2026',
    };

    await servicio.registrar(datos);
    const segundo = await servicio.registrar({ ...datos, nombre: 'Otra Persona' });

    expect(segundo.ok).toBe(false);
    expect(segundo.campo).toBe('correo');
  });

  it('valida la contraseña al iniciar sesión', async () => {
    const servicio = crearServicio();
    await servicio.registrar({
      nombre: 'Carmen Rodríguez',
      correo: 'carmen@taller.com',
      contrasena: 'Taller2026!',
      codigo: 'TALLER-2026',
    });
    servicio.cerrarSesion();

    const incorrecta = await servicio.iniciarSesion('carmen@taller.com', 'NoEsLaClave1');
    expect(incorrecta.ok).toBe(false);
    expect(incorrecta.campo).toBe('contrasena');

    const correcta = await servicio.iniciarSesion('carmen@taller.com', 'Taller2026!');
    expect(correcta.ok).toBe(true);
    expect(servicio.autenticado()).toBe(true);
  });

  it('informa cuando el correo no existe', async () => {
    const servicio = crearServicio();
    const resultado = await servicio.iniciarSesion('nadie@taller.com', 'Taller2026!');

    expect(resultado.ok).toBe(false);
    expect(resultado.campo).toBe('correo');
  });

  it('cerrar sesión limpia el estado y el almacenamiento', async () => {
    const servicio = crearServicio();
    await servicio.registrar({
      nombre: 'Carmen Rodríguez',
      correo: 'carmen@taller.com',
      contrasena: 'Taller2026!',
      codigo: 'TALLER-2026',
    });

    servicio.cerrarSesion();

    expect(servicio.autenticado()).toBe(false);
    expect(servicio.sesion()).toBeNull();
    expect(localStorage.getItem(CLAVE_SESION)).toBeNull();
  });
});
