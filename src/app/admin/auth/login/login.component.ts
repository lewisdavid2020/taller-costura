import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { WorkshopService } from '../../core/workshop.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly taller = inject(WorkshopService);

  readonly tallerNombre = this.taller.datos;
  readonly mostrarContrasena = signal(false);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly aviso = signal('');
  readonly anio = new Date().getFullYear();

  private readonly returnUrl: string;

  readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email]],
    contrasena: ['', [Validators.required]],
  });

  constructor() {
    const parametros = this.ruta.snapshot.queryParamMap;
    this.returnUrl = this.urlSegura(parametros.get('returnUrl'));

    if (parametros.get('sesion') === 'cerrada') {
      this.aviso.set('Cerraste sesión correctamente. Tus datos siguen guardados en este equipo.');
    } else if (parametros.get('registrado') === '1') {
      this.aviso.set('La cuenta de administrador quedó creada. Ya puedes iniciar sesión.');
    }
  }

  get correo() {
    return this.formulario.controls.correo;
  }

  get contrasena() {
    return this.formulario.controls.contrasena;
  }

  mensajeCorreo(): string {
    const control = this.correo;
    if (!control.touched || control.valid) return '';
    if (control.hasError('required')) return 'Escribe tu correo electrónico.';
    if (control.hasError('email')) return 'El correo no tiene un formato válido.';
    return 'Revisa este campo.';
  }

  mensajeContrasena(): string {
    const control = this.contrasena;
    if (!control.touched || control.valid) return '';
    return 'Escribe tu contraseña.';
  }

  alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  recuperarContrasena(): void {
    this.error.set('');
    this.aviso.set(
      'Por seguridad, la recuperación de acceso la gestiona el administrador del taller. Escríbele para restablecer tu contraseña.',
    );
  }

  async enviar(): Promise<void> {
    this.error.set('');
    this.aviso.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revisa los campos marcados antes de continuar.');
      return;
    }

    this.cargando.set(true);
    const resultado = await this.auth.iniciarSesion(
      this.formulario.controls.correo.value,
      this.formulario.controls.contrasena.value,
    );
    this.cargando.set(false);

    if (!resultado.ok) {
      this.error.set(resultado.error ?? 'No pudimos iniciar sesión. Inténtalo de nuevo.');
      if (resultado.campo === 'correo') this.correo.markAsTouched();
      if (resultado.campo === 'contrasena') this.contrasena.markAsTouched();
      return;
    }

    await this.router.navigateByUrl(this.returnUrl);
  }

  private urlSegura(valor: string | null): string {
    if (valor && valor.startsWith('/admin') && !valor.startsWith('//')) return valor;
    return '/admin/resumen';
  }
}
