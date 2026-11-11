import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from '../admin/core/catalog.service';
import { LandingComponent } from './landing.component';

async function configurar(): Promise<void> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [LandingComponent],
    providers: [provideRouter([])],
  }).compileComponents();
}

function montar(): HTMLElement {
  const fixture = TestBed.createComponent(LandingComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('LandingComponent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('publica los productos activos creados desde el panel', async () => {
    await configurar();
    const catalogo = TestBed.inject(CatalogService);

    catalogo.crear({
      nombre: 'Blusa de seda a medida',
      descripcion: 'Blusa confeccionada a medida con acabados a mano y prueba de calce.',
      categoria: 'Confección',
      precio: 540,
      imagenes: [],
      estado: 'activo',
    });

    const elemento = montar();
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Productos del taller');
    expect(texto).toContain('Blusa de seda a medida');
    expect(texto).toContain('$540.00');
    expect(elemento.querySelectorAll('.producto').length).toBeGreaterThan(0);
  });

  it('mantiene fuera de la página pública los productos ocultos', async () => {
    await configurar();
    const catalogo = TestBed.inject(CatalogService);

    catalogo.crear({
      nombre: 'Muestra confidencial del taller',
      descripcion: 'Producto de prueba que no debe aparecer en la página pública.',
      categoria: 'Accesorios',
      precio: 100,
      imagenes: [],
      estado: 'oculto',
    });

    const elemento = montar();

    expect(elemento.textContent).not.toContain('Muestra confidencial del taller');
  });
});
