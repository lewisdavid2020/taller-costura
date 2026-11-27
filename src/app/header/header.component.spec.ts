import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from '../admin/core/auth.service';
import { proveedoresSupabaseFake } from '../admin/core/testing/proveedores-fake';
import { establecerSesion, reiniciarSupabaseFake } from '../admin/core/testing/supabase-fake';
import { HeaderComponent } from './header.component';

async function configurar(): Promise<void> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [provideRouter([]), ...proveedoresSupabaseFake()],
  }).compileComponents();
}

async function montar(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('HeaderComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('muestra el acceso al panel cuando no hay sesión', async () => {
    await configurar();
    const elemento = await montar();
    const acceso = elemento.querySelector('.acceso');

    expect(acceso?.textContent).toContain('Iniciar sesión');
    expect(acceso?.getAttribute('href')).toBe('/admin/login');
  });

  it('cambia a "Dashboard" cuando ya hay una sesión', async () => {
    await configurar();
    const auth = TestBed.inject(AuthService);
    establecerSesion({
      id: 'usuario-1',
      email: 'carmen@taller.com',
      created_at: new Date().toISOString(),
      user_metadata: { nombre: 'Carmen Rodríguez' },
    });
    await auth.inicializar();

    const elemento = await montar();
    const acceso = elemento.querySelector('.acceso');

    expect(acceso?.textContent).toContain('Dashboard');
    expect(acceso?.getAttribute('href')).toBe('/admin/resumen');
  });
});
