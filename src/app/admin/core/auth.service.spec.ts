import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { proveedoresSupabaseFake } from './testing/proveedores-fake';
import { reiniciarSupabaseFake, sembrarRol } from './testing/supabase-fake';

function crearServicio(): AuthService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...proveedoresSupabaseFake(), AuthService] });
  return TestBed.inject(AuthService);
}

const datosRegistro = {
  nombre: 'Carmen Rodríguez',
  correo: 'carmen@taller.com',
  contrasena: 'Taller2026!',
  codigo: 'TALLER-2026',
};

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('rechaza un código de invitación inválido', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.registrar({ ...datosRegistro, codigo: 'CODIGO-MALO' });

    expect(resultado.ok).toBe(false);
    expect(resultado.campo).toBe('codigo');
    expect(servicio.autenticado()).toBe(false);
  });

  it('normaliza correo y nombre al registrar, pero requiere rol admin para ingresar', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.registrar({
      ...datosRegistro,
      nombre: '  Carmen Rodríguez  ',
      correo: 'Carmen@Taller.com',
      codigo: 'taller-2026',
    });

    expect(resultado.ok).toBe(false);
    expect(servicio.autenticado()).toBe(false);

    sembrarRol('carmen@taller.com', 'admin');
    const acceso = await servicio.iniciarSesion('carmen@taller.com', datosRegistro.contrasena);
    expect(acceso.ok).toBe(true);
    expect(servicio.autenticado()).toBe(true);
    expect(servicio.esAdmin()).toBe(true);
    expect(servicio.sesion()?.correo).toBe('carmen@taller.com');
    expect(servicio.sesion()?.nombre).toBe('Carmen Rodríguez');
  });

  it('rechaza registrar dos veces el mismo correo', async () => {
    const servicio = crearServicio();

    await servicio.registrar(datosRegistro);
    sembrarRol(datosRegistro.correo, 'admin');
    const segundo = await servicio.registrar({ ...datosRegistro, nombre: 'Otra Persona' });

    expect(segundo.ok).toBe(false);
    expect(segundo.campo).toBe('correo');
  });

  it('valida la contraseña al iniciar sesión', async () => {
    const servicio = crearServicio();
    await servicio.registrar(datosRegistro);
    sembrarRol(datosRegistro.correo, 'admin');
    await servicio.cerrarSesion();

    const incorrecta = await servicio.iniciarSesion(datosRegistro.correo, 'NoEsLaClave1');
    expect(incorrecta.ok).toBe(false);
    expect(incorrecta.campo).toBe('contrasena');

    const correcta = await servicio.iniciarSesion(datosRegistro.correo, datosRegistro.contrasena);
    expect(correcta.ok).toBe(true);
    expect(servicio.autenticado()).toBe(true);
  });

  it('informa cuando el correo no existe', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.iniciarSesion('nadie@taller.com', datosRegistro.contrasena);

    expect(resultado.ok).toBe(false);
    expect(resultado.campo).toBe('contrasena');
  });

  it('cerrar sesión limpia el estado', async () => {
    const servicio = crearServicio();
    await servicio.registrar(datosRegistro);
    sembrarRol(datosRegistro.correo, 'admin');
    await servicio.iniciarSesion(datosRegistro.correo, datosRegistro.contrasena);

    await servicio.cerrarSesion();

    expect(servicio.autenticado()).toBe(false);
    expect(servicio.esAdmin()).toBe(false);
    expect(servicio.sesion()).toBeNull();
  });
});
