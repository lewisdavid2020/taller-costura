import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from './catalog.service';
import { Producto } from './modelos';
import { proveedoresSupabaseFake } from './testing/proveedores-fake';
import { establecerFilas, reiniciarSupabaseFake } from './testing/supabase-fake';

function crearServicio(): CatalogService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...proveedoresSupabaseFake(), CatalogService] });
  return TestBed.inject(CatalogService);
}

const datosProducto: Omit<Producto, 'id' | 'creadoEn'> = {
  nombre: 'Ajuste de mangas',
  descripcion: 'Arreglo de mangas con acabado invisible y planchado final.',
  categoria: 'Arreglos',
  precio: 95,
  imagenes: [],
  estado: 'activo',
};

function filaProducto(id: string, nombre: string, estado: 'activo' | 'oculto') {
  return {
    id,
    nombre,
    descripcion: 'Descripción del producto de prueba.',
    categoria: 'Confección' as const,
    precio: 100,
    imagenes: [],
    estado,
    created_at: new Date().toISOString(),
  };
}

describe('CatalogService', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('permanece vacío cuando la tabla no tiene filas', async () => {
    const servicio = crearServicio();
    await servicio.cargar();

    expect(servicio.total()).toBe(0);
    expect(servicio.activos()).toBe(0);
    expect(servicio.ocultos()).toBe(0);
  });

  it('carga las filas y deriva los contadores de visibilidad', async () => {
    establecerFilas({
      products: [filaProducto('a', 'Vestido de lino', 'activo'), filaProducto('b', 'Muestra interna', 'oculto')],
    });
    const servicio = crearServicio();
    await servicio.cargar();

    expect(servicio.total()).toBe(2);
    expect(servicio.activos()).toBe(1);
    expect(servicio.ocultos()).toBe(1);
  });

  it('crea un producto y lo coloca al inicio', async () => {
    const servicio = crearServicio();
    const producto = await servicio.crear(datosProducto);

    expect(producto?.nombre).toBe(datosProducto.nombre);
    expect(servicio.total()).toBe(1);
    expect(servicio.productos()[0].nombre).toBe(datosProducto.nombre);
    expect(servicio.obtener(producto?.id ?? '')?.precio).toBe(95);
  });

  it('actualiza los datos de un producto existente', async () => {
    const servicio = crearServicio();
    const original = await servicio.crear(datosProducto);

    const actualizado = await servicio.actualizar(original?.id ?? '', {
      ...datosProducto,
      nombre: 'Vestido de lino bordado',
      estado: 'oculto',
    });

    expect(actualizado?.nombre).toBe('Vestido de lino bordado');
    expect(servicio.obtener(original?.id ?? '')?.estado).toBe('oculto');
    expect(servicio.ocultos()).toBe(1);
  });

  it('elimina un producto del estado local', async () => {
    const servicio = crearServicio();
    const creado = await servicio.crear(datosProducto);

    expect(await servicio.eliminar(creado?.id ?? '')).toBe(true);
    expect(servicio.total()).toBe(0);
    expect(servicio.obtener(creado?.id ?? '')).toBeUndefined();
  });

  it('devuelve null al intentar actualizar un producto inexistente', async () => {
    const servicio = crearServicio();

    const resultado = await servicio.actualizar('no-existe', datosProducto);

    expect(resultado).toBeNull();
  });
});
