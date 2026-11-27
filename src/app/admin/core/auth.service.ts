import { Injectable, computed, signal } from '@angular/core';
import { supabase, supabaseConfigurado } from './supabase.client';
import { Administrador, ResultadoAcceso } from './modelos';

interface RegistroAdministrador {
  nombre: string;
  correo: string;
  contrasena: string;
  codigo: string;
}

const CODIGO_INVITACION = 'TALLER-2026';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sesionActual = signal<Administrador | null>(null);
  private readonly listoState = signal(false);

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);
  readonly listo = this.listoState.asReadonly();

  constructor() {
    void this.inicializar();
  }

  async inicializar(): Promise<void> {
    if (!supabaseConfigurado) {
      this.listoState.set(true);
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      this.sesionActual.set(this.mapearUsuario(data.session.user));
      void this.cargarPerfil(data.session.user.id, data.session.user.email ?? '');
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      if (!user) {
        this.sesionActual.set(null);
        return;
      }
      this.sesionActual.set(this.mapearUsuario(user));
      void this.cargarPerfil(user.id, user.email ?? '');
    });

    this.listoState.set(true);
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<ResultadoAcceso> {
    if (!supabaseConfigurado) {
      return { ok: false, error: 'Supabase no está configurado. Agrega tu anon key en environments.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo.trim().toLowerCase(),
      password: contrasena,
    });

    if (error) {
      return this.mapearErrorAuth(error.message, 'login');
    }

    if (data.user) {
      this.sesionActual.set(this.mapearUsuario(data.user));
      await this.cargarPerfil(data.user.id, data.user.email ?? correo);
    }
    return { ok: true };
  }

  async registrar(datos: RegistroAdministrador): Promise<ResultadoAcceso> {
    if (!supabaseConfigurado) {
      return { ok: false, error: 'Supabase no está configurado. Agrega tu anon key en environments.' };
    }

    if (datos.codigo.trim().toUpperCase() !== CODIGO_INVITACION) {
      return {
        ok: false,
        campo: 'codigo',
        error: 'El código de invitación no es válido. Solicítalo al administrador del taller.',
      };
    }

    const correo = datos.correo.trim().toLowerCase();
    const nombre = datos.nombre.trim();
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password: datos.contrasena,
      options: {
        data: { nombre },
      },
    });

    if (error) {
      return this.mapearErrorAuth(error.message, 'registro');
    }

    if (data.user) {
      this.sesionActual.set({
        id: data.user.id,
        nombre,
        correo,
        creadoEn: data.user.created_at ?? new Date().toISOString(),
      });
      await this.cargarPerfil(data.user.id, correo);
    }

    return { ok: true };
  }

  async cerrarSesion(): Promise<void> {
    if (supabaseConfigurado) {
      await supabase.auth.signOut();
    }
    this.sesionActual.set(null);
  }

  private async cargarPerfil(userId: string, correoFallback: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('id,nombre,correo,created_at')
      .eq('id', userId)
      .maybeSingle();

    if (!data) return;
    const actual = this.sesionActual();
    if (!actual || actual.id !== userId) return;
    this.sesionActual.set({
      id: data.id,
      nombre: data.nombre ?? actual.nombre,
      correo: data.correo ?? correoFallback,
      creadoEn: data.created_at ?? actual.creadoEn,
    });
  }

  private mapearUsuario(user: { id: string; email?: string; created_at?: string; user_metadata?: Record<string, unknown> }): Administrador {
    const metadata = user.user_metadata ?? {};
    const nombre = typeof metadata['nombre'] === 'string' ? metadata['nombre'] : (user.email?.split('@')[0] ?? 'Administrador');
    return {
      id: user.id,
      nombre,
      correo: user.email ?? '',
      creadoEn: user.created_at ?? new Date().toISOString(),
    };
  }

  private mapearErrorAuth(mensaje: string, contexto: 'login' | 'registro'): ResultadoAcceso {
    const texto = mensaje.toLowerCase();
    if (texto.includes('invalid login credentials')) {
      return {
        ok: false,
        campo: contexto === 'login' ? 'contrasena' : undefined,
        error: contexto === 'login'
          ? 'Correo o contraseña incorrectos. Revisa tus datos e inténtalo de nuevo.'
          : 'No pudimos crear la cuenta con esos datos.',
      };
    }
    if (texto.includes('already registered') || texto.includes('already been registered') || texto.includes('user already registered')) {
      return {
        ok: false,
        campo: 'correo',
        error: 'Ya existe una cuenta con este correo. Inicia sesión o usa otro correo.',
      };
    }
    if (texto.includes('password') && texto.includes('least')) {
      return { ok: false, campo: 'contrasena', error: 'La contraseña no cumple los requisitos de seguridad.' };
    }
    if (texto.includes('email')) {
      return { ok: false, campo: 'correo', error: 'El correo no tiene un formato válido o no se pudo usar.' };
    }
    return { ok: false, error: 'No pudimos completar la solicitud. Inténtalo de nuevo.' };
  }
}