import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CatalogService } from './catalog.service';

function crearServicio(): CatalogService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [CatalogService] });
  return TestBed.inject(CatalogService);
}

describe('CatalogService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('inicia con el catálogo de demostración', () => {
    const servicio = crearServicio();

    expect(servicio.total()).toBe(10);
    expect(servicio.activos()).toBe(8);
    expect(servicio.ocultos()).toBe(2);
  });

  it('crea un producto y lo coloca al inicio', () => {
    const servicio = crearServicio();

    const producto = servicio.crear({
      nombre: 'Ajuste de mangas',
      descripcion: 'Arreglo de mangas con acabado invisible y planchado final.',
      categoria: 'Arreglos',
      precio: 95,
      imagenes: [],
      estado: 'activo',
    });

    expect(servicio.total()).toBe(11);
    expect(servicio.productos()[0].nombre).toBe('Ajuste de mangas');
    expect(servicio.obtener(producto.id)?.precio).toBe(95);
  });

  it('actualiza los datos de un producto existente', () => {
    const servicio = crearServicio();
    const original = servicio.productos()[0];

    const actualizado = servicio.actualizar(original.id, {
      nombre: 'Vestido de lino bordado',
      descripcion: original.descripcion,
      categoria: 'Bordados',
      precio: 1550,
      imagenes: original.imagenes,
      estado: 'oculto',
    });

    expect(actualizado?.nombre).toBe('Vestido de lino bordado');
    expect(servicio.obtener(original.id)?.estado).toBe('oculto');
    expect(servicio.ocultos()).toBe(3);
  });

  it('elimina un producto y reporta si no existe', () => {
    const servicio = crearServicio();
    const original = servicio.productos()[0];

    expect(servicio.eliminar(original.id)).toBe(true);
    expect(servicio.total()).toBe(9);
    expect(servicio.eliminar('no-existe')).toBe(false);
  });

  it('devuelve null al intentar actualizar un producto inexistente', () => {
    const servicio = crearServicio();

    const resultado = servicio.actualizar('no-existe', {
      nombre: 'Producto fantasma',
      descripcion: 'No debería existir dentro del catálogo del taller.',
      categoria: 'Accesorios',
      precio: 10,
      imagenes: [],
      estado: 'activo',
    });

    expect(resultado).toBeNull();
  });
});
