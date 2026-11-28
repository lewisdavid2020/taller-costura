import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EstadoPedido } from './modelos';
import { OrdersService } from './orders.service';
import { proveedoresSupabaseFake } from './testing/proveedores-fake';
import { establecerFilas, reiniciarSupabaseFake } from './testing/supabase-fake';

function crearServicio(): OrdersService {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({ providers: [...proveedoresSupabaseFake(), OrdersService] });
  return TestBed.inject(OrdersService);
}

function filaPedido(id: string, estado: EstadoPedido, fecha: string, total: number, servicio: string, correo: string) {
  return {
    id,
    folio: `FO-${id}`,
    cliente: 'Cliente de prueba',
    correo,
    telefono: '3000000000',
    servicio,
    fecha,
    entrega: fecha,
    total,
    estado,
  };
}

const fechaEsteMes = new Date().toISOString();

describe('OrdersService', () => {
  beforeEach(() => {
    localStorage.clear();
    reiniciarSupabaseFake();
  });

  it('permanece vacío cuando la tabla no tiene filas', async () => {
    const servicio = crearServicio();
    await servicio.cargar();

    expect(servicio.pedidos().length).toBe(0);
    expect(servicio.recientes().length).toBe(0);
    expect(servicio.cotizacionesPendientes()).toBe(0);
  });

  it('carga pedidos y deriva recientes, pendientes, clientes y servicios', async () => {
    establecerFilas({
      orders: [
        filaPedido('1', 'entregado', fechaEsteMes, 100, 'Confección', 'a@ejemplo.com'),
        filaPedido('2', 'pendiente', fechaEsteMes, 50, 'Arreglos', 'b@ejemplo.com'),
      ],
    });
    const servicio = crearServicio();
    await servicio.cargar();

    expect(servicio.pedidos().length).toBe(2);
    expect(servicio.recientes().length).toBe(2);
    expect(servicio.cotizacionesPendientes()).toBe(1);
    expect(servicio.ingresosDelMes()).toBe(100);
    expect(servicio.serviciosMasPedidos()[0].servicio).toBe('Confección');
    expect(servicio.clientes().length).toBe(2);
  });

  it('devuelve seis meses en el resumen de ventas', () => {
    const servicio = crearServicio();

    expect(servicio.ventasSeisMeses().length).toBe(6);
  });

  it('actualiza el estado y recalcula los pendientes', async () => {
    establecerFilas({ orders: [filaPedido('1', 'pendiente', fechaEsteMes, 50, 'Arreglos', 'a@ejemplo.com')] });
    const servicio = crearServicio();
    await servicio.cargar();

    expect(await servicio.cambiarEstado('1', 'entregado')).toBe(true);

    expect(servicio.cotizacionesPendientes()).toBe(0);
    expect(servicio.pedidos().find((pedido) => pedido.id === '1')?.estado).toBe('entregado');
  });

  it('archiva un pedido entregado sin afectar las métricas de ingreso', async () => {
    establecerFilas({
      orders: [filaPedido('1', 'entregado', fechaEsteMes, 100, 'Confección', 'a@ejemplo.com')],
    });
    const servicio = crearServicio();
    await servicio.cargar();

    expect(servicio.pedidosVisibles().length).toBe(1);
    expect(await servicio.archivar('1')).toBe(true);

    expect(servicio.pedidosVisibles().length).toBe(0);
    expect(servicio.archivados().length).toBe(1);
    expect(servicio.ingresosDelMes()).toBe(100);
    expect(servicio.recientes().length).toBe(0);

    expect(await servicio.restaurar('1')).toBe(true);
    expect(servicio.pedidosVisibles().length).toBe(1);
  });

  it('no archiva pedidos que no estén entregados', async () => {
    establecerFilas({
      orders: [filaPedido('1', 'pendiente', fechaEsteMes, 50, 'Arreglos', 'a@ejemplo.com')],
    });
    const servicio = crearServicio();
    await servicio.cargar();

    expect(await servicio.archivar('1')).toBe(false);
    expect(servicio.pedidosVisibles().length).toBe(1);
  });

  it('convierte una solicitud en pedido y la relaciona', async () => {
    establecerFilas({
      solicitudes_cotizacion: [
        {
          id: 'sol-1',
          nombre: 'Ana',
          correo: 'ana@ejemplo.com',
          telefono: '8090000000',
          servicio: 'Ajuste',
          tipo_solicitud: 'Cotización',
          mensaje: 'Dobladillo',
          estado: 'nueva',
          created_at: fechaEsteMes,
        },
      ],
    });
    const servicio = crearServicio();

    const pedido = await servicio.convertirSolicitud(
      {
        id: 'sol-1',
        nombre: 'Ana',
        correo: 'ana@ejemplo.com',
        telefono: '8090000000',
        servicio: 'Ajuste',
        tipoSolicitud: 'Cotización',
        mensaje: 'Dobladillo',
        estado: 'nueva',
        creadoEn: fechaEsteMes,
      },
      { total: 1500, entrega: '2026-12-01' },
    );

    expect(pedido).not.toBeNull();
    expect(pedido?.solicitudId).toBe('sol-1');
    expect(pedido?.estado).toBe('pendiente');
    expect(pedido?.total).toBe(1500);

    await servicio.cargar();
    expect(servicio.pedidos().some((p) => p.solicitudId === 'sol-1')).toBe(true);
  });
});
