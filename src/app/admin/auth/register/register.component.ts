import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { WorkshopService } from '../../core/workshop.service';
import { ToastService } from '../../core/toast.service';
import { contrasenaValida, evaluarContrasena } from '../../core/contrasena';

function contrasenaSegura(control: AbstractControl): ValidationErrors | null {
  return contrasenaValida(String(control.value ?? '')) ? null : { insegura: true };
}

function contrasenasCoinciden(grupo: AbstractControl): ValidationErrors | null {
  const contrasena = grupo.get('contrasena')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return contrasena === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly taller = inject(WorkshopService);
  private readonly toast = inject(ToastService);

  readonly tallerNombre = this.taller.datos;
  readonly mostrarContrasena = signal(false);
  readonly mostrarConfirmacion = signal(false);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly errorCorreo = signal('');
  readonly errorCodigo = signal('');
  readonly anio = new Date().getFullYear();

  readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasena: ['', [Validators.required, Validators.minLength(8), contrasenaSegura]],
      confirmar: ['', [Validators.required]],
      codigo: ['', [Validators.required]],
    },
    { validators: [contrasenasCoinciden] },
  );

  private readonly contrasenaValor = toSignal(this.formulario.controls.contrasena.valueChanges, {
    initialValue: '',
  });

  readonly fuerza = computed(() => evaluarContrasena(this.contrasenaValor()));
  readonly claseFuerza = computed(() => `adm-fuerza--${this.fuerza().puntaje + 1}`);

  get nombre() {
    return this.formulario.controls.nombre;
  }

  get correo() {
    return this.formulario.controls.correo;
  }

  get contrasena() {
    return this.formulario.controls.contrasena;
  }

  get confirmar() {
    return this.formulario.controls.confirmar;
  }

  get codigo() {
    return this.formulario.controls.codigo;
  }

  mensajeNombre(): string {
    if (!this.nombre.touched || this.nombre.valid) return '';
    if (this.nombre.hasError('required')) return 'Escribe el nombre completo del administrador.';
    if (this.nombre.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres.';
    return 'Revisa este campo.';
  }

  mensajeCorreo(): string {
    if (this.errorCorreo()) return this.errorCorreo();
    if (!this.correo.touched || this.correo.valid) return '';
    if (this.correo.hasError('required')) return 'Escribe el correo de acceso.';
    if (this.correo.hasError('email')) return 'El correo no tiene un formato válido.';
    return 'Revisa este campo.';
  }

  mensajeContrasena(): string {
    if (!this.contrasena.touched || this.contrasena.valid) return '';
    if (this.contrasena.hasError('required')) return 'Crea una contraseña para tu cuenta.';
    if (this.contrasena.hasError('minlength')) return 'La contraseña debe tener al menos 8 caracteres.';
    if (this.contrasena.hasError('insegura')) return 'Combina letras y números para proteger la cuenta.';
    return 'Revisa este campo.';
  }

  mensajeConfirmar(): string {
    if (!this.confirmar.touched) return '';
    if (this.confirmar.hasError('required')) return 'Repite la contraseña.';
    if (this.formulario.hasError('noCoinciden')) return 'Las contraseñas no coinciden.';
    return '';
  }

  mensajeCodigo(): string {
    if (this.errorCodigo()) return this.errorCodigo();
    if (!this.codigo.touched || this.codigo.valid) return '';
    return 'Escribe el código de invitación del taller.';
  }

  alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  alternarConfirmacion(): void {
    this.mostrarConfirmacion.update((valor) => !valor);
  }

  limpiarErrorCorreo(): void {
    this.errorCorreo.set('');
  }

  limpiarErrorCodigo(): void {
    this.errorCodigo.set('');
  }

  async enviar(): Promise<void> {
    this.error.set('');
    this.errorCorreo.set('');
    this.errorCodigo.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Revisa los campos marcados antes de crear la cuenta.');
      return;
    }

    this.cargando.set(true);
    const resultado = await this.auth.registrar({
      nombre: this.formulario.controls.nombre.value,
      correo: this.formulario.controls.correo.value,
      contrasena: this.formulario.controls.contrasena.value,
      codigo: this.formulario.controls.codigo.value,
    });
    this.cargando.set(false);

    if (!resultado.ok) {
      if (resultado.campo === 'correo') {
        this.errorCorreo.set(resultado.error ?? 'No pudimos usar este correo.');
        this.correo.markAsTouched();
      } else if (resultado.campo === 'codigo') {
        this.errorCodigo.set(resultado.error ?? 'El código no es válido.');
        this.codigo.markAsTouched();
      } else {
        this.error.set(resultado.error ?? 'No pudimos crear la cuenta. Inténtalo de nuevo.');
      }
      return;
    }

    this.toast.mostrar('Cuenta de administrador creada. Te damos la bienvenida al panel del taller.');
    await this.router.navigateByUrl('/admin/resumen');
  }
}
