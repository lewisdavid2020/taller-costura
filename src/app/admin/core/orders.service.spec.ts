import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { OrdersService } from './orders.service';

function crearServicio(): OrdersService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [OrdersService] });
  return TestBed.inject(OrdersService);
}

describe('OrdersService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('genera pedidos de demostración y una lista reciente corta', () => {
    const servicio = crearServicio();

    expect(servicio.pedidos().length).toBe(27);
    expect(servicio.recientes().length).toBe(6);
    expect(servicio.cotizacionesPendientes()).toBe(1);
  });

  it('calcula las ventas de los últimos seis meses', () => {
    const servicio = crearServicio();
    const ventas = servicio.ventasSeisMeses();

    expect(ventas.length).toBe(6);
    expect(ventas.every((mes) => mes.total > 0)).toBe(true);
    expect(servicio.ingresosDelMes()).toBeGreaterThan(0);
  });

  it('ordena los servicios más pedidos y calcula porcentajes', () => {
    const servicio = crearServicio();
    const servicios = servicio.serviciosMasPedidos();

    expect(servicios.length).toBe(4);
    expect(servicios[0].pedidos).toBeGreaterThanOrEqual(servicios[1].pedidos);
    expect(servicios.every((servicio) => servicio.porcentaje > 0)).toBe(true);
  });

  it('deriva los clientes con su historial y total entregado', () => {
    const servicio = crearServicio();
    const clientes = servicio.clientes();

    expect(clientes.length).toBeGreaterThan(10);
    expect(clientes[0].totalGastado).toBeGreaterThan(0);
    expect(clientes.every((cliente) => cliente.pedidos > 0)).toBe(true);
  });

  it('actualiza el estado de un pedido y recalcula pendientes', () => {
    const servicio = crearServicio();
    const pendiente = servicio.pedidos().find((pedido) => pedido.estado === 'pendiente');

    expect(pendiente).toBeDefined();
    if (!pendiente) return;

    servicio.cambiarEstado(pendiente.id, 'entregado');

    expect(servicio.cotizacionesPendientes()).toBe(0);
    expect(servicio.pedidos().find((pedido) => pedido.id === pendiente.id)?.estado).toBe('entregado');
  });
});
