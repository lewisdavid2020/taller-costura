import { Injectable, computed, signal } from '@angular/core';
import { fechaHaceDias } from './formato';
import { Producto } from './modelos';

const CLAVE_PRODUCTOS = 'taller.admin.productos.v1';

function productosIniciales(): Producto[] {
  return [
    {
      id: 'prod-vestido-lino',
      nombre: 'Vestido de lino a medida',
      descripcion:
        'Vestido midi confeccionado en lino lavado, con pinzas ajustadas al cuerpo y acabados a mano. Incluye una prueba de calce.',
      categoria: 'Confección',
      precio: 1450,
      imagenes: ['/img/producto-vestido.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(18),
    },
    {
      id: 'prod-camisa-popelina',
      nombre: 'Camisa de popelina',
      descripcion:
        'Camisa clásica de popelina con cuello italiano, canesú interior y botones de nácar. Disponible en blanco y azul denim.',
      categoria: 'Confección',
      precio: 680,
      imagenes: ['/img/producto-camisa.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(26),
    },
    {
      id: 'prod-ajuste-pantalon',
      nombre: 'Ajuste de pantalón',
      descripcion:
        'Entalle de cintura, bastas y largo de pierna. Trabajamos sobre cualquier tipo de tela conservando la caída original.',
      categoria: 'Arreglos',
      precio: 180,
      imagenes: ['/img/producto-pantalon.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(34),
    },
    {
      id: 'prod-blazer-uniforme',
      nombre: 'Blazer para uniforme escolar',
      descripcion:
        'Blazer institucional en gabardina resistente, con forro transpirable, escudo bordado y tallas consistentes por lote.',
      categoria: 'Uniformes',
      precio: 950,
      imagenes: ['/img/producto-uniforme.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(41),
    },
    {
      id: 'prod-bordado-iniciales',
      nombre: 'Bordado de iniciales',
      descripcion:
        'Monograma bordado a mano o a máquina sobre pañuelos, camisas y toallas. Elige tipografía, hilo y ubicación.',
      categoria: 'Bordados',
      precio: 220,
      imagenes: ['/img/producto-bordado.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(52),
    },
    {
      id: 'prod-neceser-lino',
      nombre: 'Neceser de lino',
      descripcion:
        'Neceser forrado con cierre de metal y asa de cinta. Ideal para guardar tijeras, carretes e hilos en el taller.',
      categoria: 'Accesorios',
      precio: 320,
      imagenes: ['/img/producto-accesorio.svg'],
      estado: 'oculto',
      creadoEn: fechaHaceDias(63),
    },
    {
      id: 'prod-falda-plisada',
      nombre: 'Falda plisada',
      descripcion:
        'Falda de pliegues encontrados en crepé ligero, con cintura limpia y forro interior. Largo personalizable.',
      categoria: 'Confección',
      precio: 890,
      imagenes: ['/img/producto-vestido.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(70),
    },
    {
      id: 'prod-delantal-taller',
      nombre: 'Delantal de taller',
      descripcion:
        'Delantal de mezclilla con bolsillos reforzados, presillas para herramientas y correa ajustable. Personalizable con bordado.',
      categoria: 'Uniformes',
      precio: 410,
      imagenes: ['/img/producto-uniforme.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(81),
    },
    {
      id: 'prod-cambio-cierre',
      nombre: 'Cambio de cierre',
      descripcion:
        'Sustitución de cierres en chamarras, pantalones y bolsos. Incluye costura reforzada y prueba de deslizamiento.',
      categoria: 'Arreglos',
      precio: 150,
      imagenes: ['/img/producto-pantalon.svg'],
      estado: 'activo',
      creadoEn: fechaHaceDias(92),
    },
    {
      id: 'prod-kit-costura',
      nombre: 'Kit de costura artesanal',
      descripcion:
        'Estuche de tela con tijeras, agujas, alfileres y tres carretes de hilo. Una pieza útil y bien terminada para regalar.',
      categoria: 'Accesorios',
      precio: 260,
      imagenes: ['/img/producto-accesorio.svg'],
      estado: 'oculto',
      creadoEn: fechaHaceDias(104),
    },
  ];
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productosState = signal<Producto[]>(this.leerProductos());

  readonly productos = this.productosState.asReadonly();
  readonly total = computed(() => this.productosState().length);
  readonly activos = computed(() => this.productosState().filter((p) => p.estado === 'activo').length);
  readonly ocultos = computed(() => this.productosState().filter((p) => p.estado === 'oculto').length);

  obtener(id: string): Producto | undefined {
    return this.productosState().find((p) => p.id === id);
  }

  crear(datos: Omit<Producto, 'id' | 'creadoEn'>): Producto {
    const producto: Producto = {
      ...datos,
      id: this.nuevoId(),
      creadoEn: new Date().toISOString(),
    };
    this.productosState.update((productos) => [producto, ...productos]);
    this.persistir();
    return producto;
  }

  actualizar(id: string, datos: Omit<Producto, 'id' | 'creadoEn'>): Producto | null {
    const actual = this.obtener(id);
    if (!actual) return null;
    const actualizado: Producto = { ...actual, ...datos };
    this.productosState.update((productos) => productos.map((p) => (p.id === id ? actualizado : p)));
    this.persistir();
    return actualizado;
  }

  eliminar(id: string): boolean {
    const existe = this.productosState().some((p) => p.id === id);
    if (!existe) return false;
    this.productosState.update((productos) => productos.filter((p) => p.id !== id));
    this.persistir();
    return true;
  }

  private persistir(): void {
    try {
      localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(this.productosState()));
    } catch {
      // Si el almacenamiento está lleno, los cambios se conservan en memoria.
    }
  }

  private leerProductos(): Producto[] {
    try {
      const crudo = localStorage.getItem(CLAVE_PRODUCTOS);
      if (crudo === null) return productosIniciales();
      const datos: unknown = JSON.parse(crudo);
      if (!Array.isArray(datos)) return productosIniciales();
      return datos.filter(
        (item): item is Producto =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Producto).id === 'string' &&
          typeof (item as Producto).nombre === 'string' &&
          typeof (item as Producto).precio === 'number' &&
          Array.isArray((item as Producto).imagenes),
      );
    } catch {
      return productosIniciales();
    }
  }

  private nuevoId(): string {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `prod-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
