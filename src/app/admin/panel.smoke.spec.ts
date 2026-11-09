import { Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsListComponent } from './products/products-list/products-list.component';
import { ProductFormComponent } from './products/product-form/product-form.component';
import { OrdersComponent } from './orders/orders.component';
import { ClientsComponent } from './clients/clients.component';
import { SettingsComponent } from './settings/settings.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminLayoutComponent } from './layout/admin-layout.component';

async function montar<T>(componente: Type<T>): Promise<HTMLElement> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [componente],
    providers: [provideRouter([])],
  }).compileComponents();

  const fixture = TestBed.createComponent(componente);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('Pantallas del panel administrativo', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza el resumen con tarjetas, gráfico y pedidos recientes', async () => {
    const elemento = await montar(DashboardComponent);
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Total de productos');
    expect(texto).toContain('Ventas de los últimos 6 meses');
    expect(texto).toContain('Servicios más pedidos');
    expect(texto).toContain('Pedidos recientes');
    expect(elemento.querySelector('svg.chart-ventas')).toBeTruthy();
    expect(elemento.querySelectorAll('.stat-card').length).toBe(4);
  });

  it('renderiza el catálogo con tabla, filtros y paginación', async () => {
    const elemento = await montar(ProductsListComponent);
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Productos');
    expect(elemento.querySelector('#buscar-productos')).toBeTruthy();
    expect(elemento.querySelector('#filtrar-categoria')).toBeTruthy();
    expect(elemento.querySelectorAll('tbody tr').length).toBe(6);
    expect(elemento.querySelector('.paginacion')).toBeTruthy();
  });

  it('renderiza el formulario de alta de producto', async () => {
    const elemento = await montar(ProductFormComponent);
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Agregar producto');
    expect(elemento.querySelector('#producto-nombre')).toBeTruthy();
    expect(elemento.querySelector('#producto-descripcion')).toBeTruthy();
    expect(elemento.querySelector('#producto-categoria')).toBeTruthy();
    expect(elemento.querySelector('#producto-precio')).toBeTruthy();
    expect(elemento.querySelector('#producto-activo')).toBeTruthy();
  });

  it('renderiza pedidos, clientes y configuración sin errores', async () => {
    const pedidos = await montar(OrdersComponent);
    expect(pedidos.textContent).toContain('Pedidos');
    expect(pedidos.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
    expect(pedidos.querySelectorAll('.pedido-movil').length).toBeGreaterThan(0);

    const clientes = await montar(ClientsComponent);
    expect(clientes.textContent).toContain('Clientes');
    expect(clientes.querySelectorAll('tbody tr').length).toBeGreaterThan(0);
    expect(clientes.querySelectorAll('.cliente-movil').length).toBeGreaterThan(0);

    const ajustes = await montar(SettingsComponent);
    expect(ajustes.textContent).toContain('Datos del taller');
    expect(ajustes.querySelector('#ajuste-whatsapp')).toBeTruthy();
  });

  it('ofrece volver a la página principal sin cerrar sesión', async () => {
    const elemento = await montar(AdminLayoutComponent);
    const principal = elemento.querySelector('.admin-principal');
    const principalMovil = elemento.querySelector('.admin-topbar__principal');

    expect(principal?.textContent).toContain('Principal');
    expect(principal?.getAttribute('href')).toBe('/');
    expect(principalMovil?.textContent).toContain('Principal');
    expect(principalMovil?.getAttribute('href')).toBe('/');
  });

  it('renderiza el registro con indicador de contraseña', async () => {
    const elemento = await montar(RegisterComponent);
    const texto = elemento.textContent ?? '';

    expect(texto).toContain('Crear administrador');
    expect(texto).toContain('Código de invitación');
    expect(elemento.querySelector('#registro-contrasena')).toBeTruthy();
    expect(elemento.querySelector('.adm-fuerza')).toBeTruthy();
  });
});
