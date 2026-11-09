import { describe, expect, it } from 'vitest';
import { contrasenaValida, evaluarContrasena, hashContrasena } from './contrasena';

describe('evaluarContrasena', () => {
  it('marca como muy débil una contraseña vacía', () => {
    expect(evaluarContrasena('').puntaje).toBe(0);
    expect(evaluarContrasena('').etiqueta).toBe('Muy débil');
  });

  it('sube de nivel con longitud y variedad de caracteres', () => {
    expect(evaluarContrasena('abc123').puntaje).toBeLessThan(2);
    expect(evaluarContrasena('Taller2026!').puntaje).toBeGreaterThanOrEqual(3);
  });

  it('penaliza contraseñas obvias', () => {
    expect(evaluarContrasena('1234567890').puntaje).toBeLessThanOrEqual(1);
    expect(evaluarContrasena('password123').puntaje).toBeLessThanOrEqual(1);
  });
});

describe('contrasenaValida', () => {
  it('exige al menos 8 caracteres, letras y números', () => {
    expect(contrasenaValida('corta1')).toBe(false);
    expect(contrasenaValida('sololetras')).toBe(false);
    expect(contrasenaValida('12345678')).toBe(false);
    expect(contrasenaValida('Taller2026')).toBe(true);
  });
});

describe('hashContrasena', () => {
  it('genera un hash determinista y distinto por contraseña', async () => {
    const primero = await hashContrasena('Taller2026!');
    const segundo = await hashContrasena('Taller2026!');
    const otro = await hashContrasena('OtraClave2026!');

    expect(primero).toBe(segundo);
    expect(primero).not.toBe(otro);
    expect(primero.length).toBeGreaterThan(10);
  });
});
