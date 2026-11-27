import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from '../admin/core/catalog.service';
import { proveedoresSupabaseFake } from '../admin/core/testing/proveedores-fake';
import { establecerFilas, reiniciarSupabaseFake } from '../admin/core/testing/supabase-fake';
import { LandingComponent } from './landing.component';

async function configurar(): Promise<void> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [LandingComponent],
    providers: [provideRouter([]), ...proveedoresSupabaseFake()],
  }).compileComponents();
}

function montar(): HTMLElement {
  const fixture = TestBed.createComponent(LandingComponent);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

function filaProducto(nombre: string, estado: 'activo' | 'oculto') {
  return {
    id: nombre,
    nombre,
    descripcion: 'Descripción del producto de prueba.',
    categoria: 'Confección' as const,
    precio: 540,
    imagenes: [],
    estado,
    created_at: new Date().toISOString(),
  };
}

describe('LandingComponent', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('publica los productos activos del catálogo', async () => {
    await configurar();
    const catalogo = TestBed.inject(CatalogService);
    establecerFilas({ products: [filaProducto('Blusa de seda a medida', 'activo')] });
    await catalogo.cargar();

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
    establecerFilas({ products: [filaProducto('Muestra confidencial del taller', 'oculto')] });
    await catalogo.cargar();

    const elemento = montar();

    expect(elemento.textContent).not.toContain('Muestra confidencial del taller');
  });
});
