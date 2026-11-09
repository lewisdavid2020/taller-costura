import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../core/catalog.service';
import { OrdersService } from '../core/orders.service';
import { AuthService } from '../core/auth.service';
import { formatearFechaLarga, formatearFecha, formatearNumero, formatearPrecio, saludoSegunHora } from '../core/formato';
import { EstadoBadgeComponent } from '../shared/estado-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, EstadoBadgeComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly catalogo = inject(CatalogService);
  private readonly pedidosService = inject(OrdersService);
  private readonly auth = inject(AuthService);

  readonly productosTotal = this.catalogo.total;
  readonly productosActivos = this.catalogo.activos;
  readonly productosOcultos = this.catalogo.ocultos;

  readonly pedidosDelMes = this.pedidosService.pedidosDelMes;
  readonly cotizacionesPendientes = this.pedidosService.cotizacionesPendientes;
  readonly ingresosDelMes = this.pedidosService.ingresosDelMes;
  readonly variacion = this.pedidosService.variacionIngresos;
  readonly recientes = this.pedidosService.recientes;
  readonly servicios = this.pedidosService.serviciosMasPedidos;
  readonly ventas = this.pedidosService.ventasSeisMeses;

  readonly saludo = saludoSegunHora();
  readonly fechaHoy = formatearFechaLarga(new Date());

  readonly nombrePila = computed(() => {
    const nombre = this.auth.sesion()?.nombre.trim() ?? 'administrador';
    return nombre.split(/\s+/)[0] || 'administrador';
  });

  readonly enProceso = computed(
    () => this.pedidosService.pedidos().filter((pedido) => pedido.estado === 'en proceso').length,
  );

  readonly totalSemestre = computed(() => this.ventas().reduce((suma, mes) => suma + mes.total, 0));

  readonly variacionTexto = computed(() => {
    const valor = this.variacion();
    if (valor === null) return '';
    return `${valor > 0 ? '+' : ''}${valor}%`;
  });

  readonly variacionPositiva = computed(() => (this.variacion() ?? 0) >= 0);

  readonly puntosVentas = computed(() => {
    const datos = this.ventas();
    const maximo = Math.max(...datos.map((d) => d.total), 1);
    const izquierda = 20;
    const derecha = 700;
    const arriba = 24;
    const abajo = 186;
    const paso = (derecha - izquierda) / Math.max(datos.length - 1, 1);

    return datos.map((dato, indice) => ({
      ...dato,
      x: izquierda + indice * paso,
      y: abajo - (dato.total / maximo) * (abajo - arriba),
    }));
  });

  readonly lineaVentas = computed(() =>
    this.puntosVentas()
      .map((punto, indice) => `${indice === 0 ? 'M' : 'L'} ${punto.x.toFixed(1)} ${punto.y.toFixed(1)}`)
      .join(' '),
  );

  readonly areaVentas = computed(() => {
    const puntos = this.puntosVentas();
    if (puntos.length === 0) return '';
    const primero = puntos[0];
    const ultimo = puntos[puntos.length - 1];
    return `${this.lineaVentas()} L ${ultimo.x.toFixed(1)} 186 L ${primero.x.toFixed(1)} 186 Z`;
  });

  readonly guiasVentas = [40, 90, 140, 186];

  readonly resumenVentas = computed(() =>
    this.ventas()
      .map((mes) => `${mes.etiqueta}: ${formatearPrecio(mes.total)}`)
      .join('. '),
  );

  formatearPrecio(valor: number): string {
    return formatearPrecio(valor);
  }

  formatearNumero(valor: number): string {
    return formatearNumero(valor);
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }
}
