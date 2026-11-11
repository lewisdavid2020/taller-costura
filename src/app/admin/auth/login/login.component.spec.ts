import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('muestra el formulario de acceso en español', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Iniciar sesión');
    expect(texto).toContain('¿Olvidaste tu contraseña?');
    expect(fixture.nativeElement.querySelector('#login-correo')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#login-contrasena')).toBeTruthy();
  });

  it('ofrece volver a la página principal', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();

    const volver = (fixture.nativeElement as HTMLElement).querySelector('.auth-volver');
    expect(volver?.textContent).toContain('Volver a la página principal');
    expect(volver?.getAttribute('href')).toBe('/');
  });

  it('bloquea el envío y muestra error cuando los campos están vacíos', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const componente = fixture.componentInstance;
    fixture.detectChanges();

    await componente.enviar();
    fixture.detectChanges();

    expect(componente.error()).toContain('Revisa los campos');
    expect(componente.formulario.invalid).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escribe tu correo electrónico');
  });

  it('alterna la visibilidad de la contraseña', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const componente = fixture.componentInstance;

    expect(componente.mostrarContrasena()).toBe(false);
    componente.alternarContrasena();
    expect(componente.mostrarContrasena()).toBe(true);
  });
});
