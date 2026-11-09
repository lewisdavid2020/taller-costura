import { Injectable, computed, signal } from '@angular/core';
import { ClienteResumen, EstadoPedido, Pedido } from './modelos';
import { mesCorto } from './formato';

const CLAVE_PEDIDOS = 'taller.admin.pedidos.v1';

function fechaMes(mesesAtras: number, dia: number): string {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, dia, 10, 0, 0, 0);
  return fecha.toISOString();
}

function fechaEsteMes(dia: number): string {
  const hoy = new Date();
  const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), Math.min(dia, hoy.getDate()), 10, 0, 0, 0);
  return fecha.toISOString();
}

function entregaDe(fecha: string, dias: number): string {
  const entrega = new Date(fecha);
  entrega.setDate(entrega.getDate() + dias);
  return entrega.toISOString();
}

function pedidosIniciales(): Pedido[] {
  const base: Array<Omit<Pedido, 'id' | 'entrega'>> = [
    // Mes en curso
    {
      folio: 'PED-1086',
      cliente: 'Andrea Morales',
      correo: 'andrea.morales@correo.com',
      telefono: '555 102 4488',
      servicio: 'Confección a medida',
      fecha: fechaEsteMes(1),
      total: 1450,
      estado: 'en proceso',
    },
    {
      folio: 'PED-1085',
      cliente: 'Luis Herrera',
      correo: 'luis.herrera@correo.com',
      telefono: '555 318 9021',
      servicio: 'Arreglos y ajustes',
      fecha: fechaEsteMes(2),
      total: 180,
      estado: 'entregado',
    },
    {
      folio: 'PED-1084',
      cliente: 'Valentina Cruz',
      correo: 'valentina.cruz@correo.com',
      telefono: '555 764 1290',
      servicio: 'Bordados personalizados',
      fecha: fechaEsteMes(3),
      total: 220,
      estado: 'pendiente',
    },
    {
      folio: 'PED-1083',
      cliente: 'Mario Salas',
      correo: 'mario.salas@correo.com',
      telefono: '555 220 7734',
      servicio: 'Confección a medida',
      fecha: fechaEsteMes(4),
      total: 680,
      estado: 'listo',
    },
    {
      folio: 'PED-1082',
      cliente: 'Paola Ríos',
      correo: 'paola.rios@correo.com',
      telefono: '555 447 6612',
      servicio: 'Uniformes por lote',
      fecha: fechaEsteMes(6),
      total: 950,
      estado: 'entregado',
    },
    // Mes anterior
    {
      folio: 'PED-1081',
      cliente: 'Renata Pineda',
      correo: 'renata.pineda@correo.com',
      telefono: '555 208 1199',
      servicio: 'Confección a medida',
      fecha: fechaMes(1, 25),
      total: 890,
      estado: 'entregado',
    },
    {
      folio: 'PED-1080',
      cliente: 'Diego Castaño',
      correo: 'diego.castano@correo.com',
      telefono: '555 913 5520',
      servicio: 'Confección a medida',
      fecha: fechaMes(1, 21),
      total: 1450,
      estado: 'entregado',
    },
    {
      folio: 'PED-1079',
      cliente: 'Alba Serrano',
      correo: 'alba.serrano@correo.com',
      telefono: '555 662 8041',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(1, 16),
      total: 410,
      estado: 'entregado',
    },
    {
      folio: 'PED-1078',
      cliente: 'Tomás Guerra',
      correo: 'tomas.guerra@correo.com',
      telefono: '555 390 2276',
      servicio: 'Accesorios de taller',
      fecha: fechaMes(1, 11),
      total: 320,
      estado: 'entregado',
    },
    {
      folio: 'PED-1077',
      cliente: 'Inés Vidal',
      correo: 'ines.vidal@correo.com',
      telefono: '555 733 4408',
      servicio: 'Confección a medida',
      fecha: fechaMes(1, 5),
      total: 680,
      estado: 'entregado',
    },
    // Hace 2 meses
    {
      folio: 'PED-1076',
      cliente: 'Carla Méndez',
      correo: 'carla.mendez@correo.com',
      telefono: '555 118 3367',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(2, 27),
      total: 950,
      estado: 'entregado',
    },
    {
      folio: 'PED-1075',
      cliente: 'Julián Ospina',
      correo: 'julian.ospina@correo.com',
      telefono: '555 884 9910',
      servicio: 'Arreglos y ajustes',
      fecha: fechaMes(2, 22),
      total: 180,
      estado: 'entregado',
    },
    {
      folio: 'PED-1074',
      cliente: 'Sofía Beltrán',
      correo: 'sofia.beltran@correo.com',
      telefono: '555 205 6673',
      servicio: 'Bordados personalizados',
      fecha: fechaMes(2, 17),
      total: 220,
      estado: 'entregado',
    },
    {
      folio: 'PED-1073',
      cliente: 'Emilio Navas',
      correo: 'emilio.navas@correo.com',
      telefono: '555 640 1128',
      servicio: 'Confección a medida',
      fecha: fechaMes(2, 9),
      total: 1450,
      estado: 'entregado',
    },
    // Hace 3 meses
    {
      folio: 'PED-1072',
      cliente: 'Lucía Ferrer',
      correo: 'lucia.ferrer@correo.com',
      telefono: '555 901 7754',
      servicio: 'Confección a medida',
      fecha: fechaMes(3, 26),
      total: 680,
      estado: 'entregado',
    },
    {
      folio: 'PED-1071',
      cliente: 'Bruno Salgado',
      correo: 'bruno.salgado@correo.com',
      telefono: '555 337 2601',
      servicio: 'Confección a medida',
      fecha: fechaMes(3, 19),
      total: 890,
      estado: 'entregado',
    },
    {
      folio: 'PED-1070',
      cliente: 'Marina Duarte',
      correo: 'marina.duarte@correo.com',
      telefono: '555 452 8830',
      servicio: 'Accesorios de taller',
      fecha: fechaMes(3, 12),
      total: 260,
      estado: 'entregado',
    },
    {
      folio: 'PED-1069',
      cliente: 'Gonzalo Peña',
      correo: 'gonzalo.pena@correo.com',
      telefono: '555 728 5514',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(3, 6),
      total: 410,
      estado: 'entregado',
    },
    // Hace 4 meses
    {
      folio: 'PED-1068',
      cliente: 'Regina Solís',
      correo: 'regina.solis@correo.com',
      telefono: '555 116 9042',
      servicio: 'Confección a medida',
      fecha: fechaMes(4, 28),
      total: 1450,
      estado: 'entregado',
    },
    {
      folio: 'PED-1067',
      cliente: 'Óscar Lemus',
      correo: 'oscar.lemus@correo.com',
      telefono: '555 883 2207',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(4, 20),
      total: 950,
      estado: 'entregado',
    },
    {
      folio: 'PED-1066',
      cliente: 'Nadia Robles',
      correo: 'nadia.robles@correo.com',
      telefono: '555 409 3378',
      servicio: 'Arreglos y ajustes',
      fecha: fechaMes(4, 13),
      total: 180,
      estado: 'entregado',
    },
    {
      folio: 'PED-1065',
      cliente: 'Iván Cárdenas',
      correo: 'ivan.cardenas@correo.com',
      telefono: '555 672 1195',
      servicio: 'Bordados personalizados',
      fecha: fechaMes(4, 7),
      total: 220,
      estado: 'entregado',
    },
    // Hace 5 meses
    {
      folio: 'PED-1064',
      cliente: 'Elena Vargas',
      correo: 'elena.vargas@correo.com',
      telefono: '555 218 6640',
      servicio: 'Confección a medida',
      fecha: fechaMes(5, 27),
      total: 680,
      estado: 'entregado',
    },
    {
      folio: 'PED-1063',
      cliente: 'Samuel Quiroz',
      correo: 'samuel.quiroz@correo.com',
      telefono: '555 730 8821',
      servicio: 'Confección a medida',
      fecha: fechaMes(5, 21),
      total: 890,
      estado: 'entregado',
    },
    {
      folio: 'PED-1062',
      cliente: 'Teresa Molina',
      correo: 'teresa.molina@correo.com',
      telefono: '555 344 1156',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(5, 15),
      total: 410,
      estado: 'entregado',
    },
    {
      folio: 'PED-1061',
      cliente: 'Facundo Reyes',
      correo: 'facundo.reyes@correo.com',
      telefono: '555 995 2203',
      servicio: 'Accesorios de taller',
      fecha: fechaMes(5, 9),
      total: 320,
      estado: 'entregado',
    },
    {
      folio: 'PED-1060',
      cliente: 'Amparo Gil',
      correo: 'amparo.gil@correo.com',
      telefono: '555 406 7719',
      servicio: 'Uniformes por lote',
      fecha: fechaMes(5, 3),
      total: 950,
      estado: 'entregado',
    },
  ];

  return base.map((pedido, indice) => ({
    ...pedido,
    id: `ped-${1086 - indice}`,
    entrega: entregaDe(pedido.fecha, 9 + (indice % 4)),
  }));
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly pedidosState = signal<Pedido[]>(this.leerPedidos());

  readonly pedidos = this.pedidosState.asReadonly();

  readonly recientes = computed(() =>
    [...this.pedidosState()]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 6),
  );

  readonly pedidosDelMes = computed(() => {
    const hoy = new Date();
    return this.pedidosState().filter((p) => this.mismoMes(new Date(p.fecha), hoy)).length;
  });

  readonly cotizacionesPendientes = computed(
    () => this.pedidosState().filter((p) => p.estado === 'pendiente').length,
  );

  readonly ingresosDelMes = computed(() => this.sumaEntregados(0));
  readonly ingresosMesAnterior = computed(() => this.sumaEntregados(1));

  readonly variacionIngresos = computed<number | null>(() => {
    const anterior = this.ingresosMesAnterior();
    if (anterior <= 0) return null;
    return Math.round(((this.ingresosDelMes() - anterior) / anterior) * 100);
  });

  readonly ventasSeisMeses = computed(() => {
    const hoy = new Date();
    return Array.from({ length: 6 }, (_, indice) => {
      const mesesAtras = 5 - indice;
      const mes = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
      const total = this.pedidosState()
        .filter((p) => p.estado === 'entregado' && this.mismoMes(new Date(p.fecha), mes))
        .reduce((suma, p) => suma + p.total, 0);
      return { etiqueta: mesCorto(mes), total, fecha: mes.toISOString() };
    });
  });

  readonly serviciosMasPedidos = computed(() => {
    const conteo = new Map<string, number>();
    for (const pedido of this.pedidosState()) {
      conteo.set(pedido.servicio, (conteo.get(pedido.servicio) ?? 0) + 1);
    }
    const total = this.pedidosState().length || 1;
    return [...conteo.entries()]
      .map(([servicio, pedidos]) => ({
        servicio,
        pedidos,
        porcentaje: Math.round((pedidos / total) * 100),
      }))
      .sort((a, b) => b.pedidos - a.pedidos)
      .slice(0, 4);
  });

  readonly clientes = computed<ClienteResumen[]>(() => {
    const mapa = new Map<string, ClienteResumen>();
    for (const pedido of [...this.pedidosState()].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
      const actual = mapa.get(pedido.correo);
      if (actual) {
        actual.pedidos += 1;
        if (pedido.estado === 'entregado') actual.totalGastado += pedido.total;
        actual.ultimoPedido = pedido.fecha;
        continue;
      }
      mapa.set(pedido.correo, {
        nombre: pedido.cliente,
        correo: pedido.correo,
        telefono: pedido.telefono,
        pedidos: 1,
        totalGastado: pedido.estado === 'entregado' ? pedido.total : 0,
        ultimoPedido: pedido.fecha,
      });
    }
    return [...mapa.values()].sort((a, b) => b.totalGastado - a.totalGastado);
  });

  cambiarEstado(id: string, estado: EstadoPedido): void {
    this.pedidosState.update((pedidos) =>
      pedidos.map((pedido) => (pedido.id === id ? { ...pedido, estado } : pedido)),
    );
    this.persistir();
  }

  private sumaEntregados(mesesAtras: number): number {
    const hoy = new Date();
    const mes = new Date(hoy.getFullYear(), hoy.getMonth() - mesesAtras, 1);
    return this.pedidosState()
      .filter((p) => p.estado === 'entregado' && this.mismoMes(new Date(p.fecha), mes))
      .reduce((suma, p) => suma + p.total, 0);
  }

  private mismoMes(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
  }

  private persistir(): void {
    try {
      localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(this.pedidosState()));
    } catch {
      // Los cambios permanecen en memoria si no hay almacenamiento disponible.
    }
  }

  private leerPedidos(): Pedido[] {
    try {
      const crudo = localStorage.getItem(CLAVE_PEDIDOS);
      if (crudo === null) return pedidosIniciales();
      const datos: unknown = JSON.parse(crudo);
      if (!Array.isArray(datos)) return pedidosIniciales();
      return datos.filter(
        (item): item is Pedido =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Pedido).id === 'string' &&
          typeof (item as Pedido).folio === 'string' &&
          typeof (item as Pedido).total === 'number',
      );
    } catch {
      return pedidosIniciales();
    }
  }
}
