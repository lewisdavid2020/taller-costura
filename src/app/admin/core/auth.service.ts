import { Injectable, computed, signal } from '@angular/core';
import { Administrador, ResultadoAcceso } from './modelos';
import { hashContrasena } from './contrasena';

interface UsuarioGuardado extends Administrador {
  hash: string;
}

interface RegistroAdministrador {
  nombre: string;
  correo: string;
  contrasena: string;
  codigo: string;
}

const CLAVE_USUARIOS = 'taller.admin.usuarios.v1';
const CLAVE_SESION = 'taller.admin.sesion.v1';
const CODIGO_INVITACION = 'TALLER-2026';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarios = signal<UsuarioGuardado[]>(this.leerUsuarios());
  private readonly sesionActual = signal<Administrador | null>(this.leerSesion());

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

  async iniciarSesion(correo: string, contrasena: string): Promise<ResultadoAcceso> {
    const correoNormalizado = correo.trim().toLowerCase();
    const usuario = this.usuarios().find((u) => u.correo === correoNormalizado);

    if (!usuario) {
      return {
        ok: false,
        campo: 'correo',
        error: 'No encontramos una cuenta con ese correo. Revisa que esté bien escrito.',
      };
    }

    const hash = await hashContrasena(contrasena);
    if (hash !== usuario.hash) {
      return {
        ok: false,
        campo: 'contrasena',
        error: 'La contraseña no es correcta. Inténtalo de nuevo.',
      };
    }

    const administrador: Administrador = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      creadoEn: usuario.creadoEn,
    };
    this.guardarSesion(administrador);
    return { ok: true };
  }

  async registrar(datos: RegistroAdministrador): Promise<ResultadoAcceso> {
    if (datos.codigo.trim().toUpperCase() !== CODIGO_INVITACION) {
      return {
        ok: false,
        campo: 'codigo',
        error: 'El código de invitación no es válido. Solicítalo al administrador del taller.',
      };
    }

    const correoNormalizado = datos.correo.trim().toLowerCase();
    if (this.usuarios().some((u) => u.correo === correoNormalizado)) {
      return {
        ok: false,
        campo: 'correo',
        error: 'Ya existe una cuenta con este correo. Inicia sesión o usa otro correo.',
      };
    }

    const administrador: Administrador = {
      id: this.nuevoId(),
      nombre: datos.nombre.trim(),
      correo: correoNormalizado,
      creadoEn: new Date().toISOString(),
    };

    const usuario: UsuarioGuardado = {
      ...administrador,
      hash: await hashContrasena(datos.contrasena),
    };

    this.usuarios.update((usuarios) => [...usuarios, usuario]);
    this.persistirUsuarios();
    this.guardarSesion(administrador);
    return { ok: true };
  }

  cerrarSesion(): void {
    this.sesionActual.set(null);
    this.eliminar(CLAVE_SESION);
  }

  private guardarSesion(administrador: Administrador): void {
    this.sesionActual.set(administrador);
    this.escribir(CLAVE_SESION, JSON.stringify(administrador));
  }

  private persistirUsuarios(): void {
    this.escribir(CLAVE_USUARIOS, JSON.stringify(this.usuarios()));
  }

  private leerUsuarios(): UsuarioGuardado[] {
    const crudo = this.leer(CLAVE_USUARIOS);
    if (!crudo) return [];
    try {
      const datos: unknown = JSON.parse(crudo);
      if (!Array.isArray(datos)) return [];
      return datos.filter(
        (item): item is UsuarioGuardado =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as UsuarioGuardado).id === 'string' &&
          typeof (item as UsuarioGuardado).correo === 'string' &&
          typeof (item as UsuarioGuardado).hash === 'string',
      );
    } catch {
      return [];
    }
  }

  private leerSesion(): Administrador | null {
    const crudo = this.leer(CLAVE_SESION);
    if (!crudo) return null;
    try {
      const datos = JSON.parse(crudo) as Partial<Administrador>;
      if (typeof datos.id === 'string' && typeof datos.nombre === 'string' && typeof datos.correo === 'string') {
        return {
          id: datos.id,
          nombre: datos.nombre,
          correo: datos.correo,
          creadoEn: typeof datos.creadoEn === 'string' ? datos.creadoEn : new Date().toISOString(),
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private nuevoId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `adm-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private leer(clave: string): string | null {
    try {
      return localStorage.getItem(clave);
    } catch {
      return null;
    }
  }

  private escribir(clave: string, valor: string): void {
    try {
      localStorage.setItem(clave, valor);
    } catch {
      // El panel sigue funcionando en memoria si el navegador bloquea el almacenamiento.
    }
  }

  private eliminar(clave: string): void {
    try {
      localStorage.removeItem(clave);
    } catch {
      // Sin almacenamiento disponible: la sesión solo vive en memoria.
    }
  }
}
