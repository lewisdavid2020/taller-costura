import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { WorkshopService } from '../core/workshop.service';
import { ToastService } from '../core/toast.service';
import { PageHeaderComponent } from '../shared/page-header.component';
import { iniciales } from '../core/formato';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeaderComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly taller = inject(WorkshopService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly sesion = this.auth.sesion;
  readonly errorFormulario = signal('');

  readonly formulario = this.fb.nonNullable.group({
    nombre: [this.taller.datos().nombre, [Validators.required, Validators.minLength(2)]],
    whatsapp: [
      this.taller.datos().whatsapp,
      [Validators.required, Validators.pattern(/^[0-9+\s()-]{7,20}$/)],
    ],
    correo: [this.taller.datos().correo, [Validators.required, Validators.email]],
    direccion: [this.taller.datos().direccion, [Validators.required, Validators.minLength(5)]],
    horario: [this.taller.datos().horario, [Validators.required, Validators.minLength(5)]],
  });

  get nombre() {
    return this.formulario.controls.nombre;
  }

  get whatsapp() {
    return this.formulario.controls.whatsapp;
  }

  get correo() {
    return this.formulario.controls.correo;
  }

  get direccion() {
    return this.formulario.controls.direccion;
  }

  get horario() {
    return this.formulario.controls.horario;
  }

  iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  mensajeNombre(): string {
    if (!this.nombre.touched || this.nombre.valid) return '';
    if (this.nombre.hasError('required')) return 'Escribe el nombre del taller.';
    if (this.nombre.hasError('minlength')) return 'El nombre debe tener al menos 2 caracteres.';
    return 'Revisa este campo.';
  }

  mensajeWhatsapp(): string {
    if (!this.whatsapp.touched || this.whatsapp.valid) return '';
    if (this.whatsapp.hasError('required')) return 'Escribe el WhatsApp del taller.';
    if (this.whatsapp.hasError('pattern')) return 'Usa solo números, espacios, paréntesis o guiones (7 a 20 caracteres).';
    return 'Revisa este campo.';
  }

  mensajeCorreo(): string {
    if (!this.correo.touched || this.correo.valid) return '';
    if (this.correo.hasError('required')) return 'Escribe el correo de contacto.';
    if (this.correo.hasError('email')) return 'El correo no tiene un formato válido.';
    return 'Revisa este campo.';
  }

  mensajeDireccion(): string {
    if (!this.direccion.touched || this.direccion.valid) return '';
    if (this.direccion.hasError('required')) return 'Escribe la dirección del taller.';
    if (this.direccion.hasError('minlength')) return 'La dirección debe tener al menos 5 caracteres.';
    return 'Revisa este campo.';
  }

  mensajeHorario(): string {
    if (!this.horario.touched || this.horario.valid) return '';
    if (this.horario.hasError('required')) return 'Escribe el horario de atención.';
    if (this.horario.hasError('minlength')) return 'El horario debe tener al menos 5 caracteres.';
    return 'Revisa este campo.';
  }

  guardar(): void {
    this.errorFormulario.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorFormulario.set('Revisa los campos marcados antes de guardar la configuración.');
      return;
    }

    this.taller.guardar(this.formulario.getRawValue());
    this.formulario.markAsPristine();
    this.toast.mostrar('La configuración del taller se guardó correctamente.');
  }
}
