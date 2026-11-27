import { Component, computed, inject, signal } from '@angular/core';
import { CatalogService } from '../admin/core/catalog.service';
import { CATEGORIAS_PRODUCTO, ICONO_CATEGORIA } from '../admin/core/catalogos';
import { CategoriaProducto, Producto } from '../admin/core/modelos';
import { HeaderComponent } from '../header/header.component';
import { ProductCardComponent } from '../product-card/product-card.component';

type OrdenProductos = 'destacados' | 'precio-asc' | 'precio-desc' | 'nombre';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [HeaderComponent, ProductCardComponent],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent {
  private readonly catalogo = inject(CatalogService);

  readonly nombreTaller = 'Julia Rosa Creaciones';
  readonly anio = new Date().getFullYear();
  readonly categorias = CATEGORIAS_PRODUCTO;
  readonly iconos = ICONO_CATEGORIA;

  readonly categoriaSeleccionada = signal<CategoriaProducto | 'todas'>('todas');
  readonly ordenSeleccionado = signal<OrdenProductos>('destacados');

  readonly productosActivos = computed(() =>
    this.catalogo.productos().filter((producto) => producto.estado === 'activo'),
  );

  readonly conteoPorCategoria = computed(() => {
    const conteo = {} as Record<CategoriaProducto, number>;
    for (const categoria of this.categorias) {
      conteo[categoria] = this.productosActivos().filter((producto) => producto.categoria === categoria).length;
    }
    return conteo;
  });

  readonly productosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const filtrados =
      categoria === 'todas'
        ? [...this.productosActivos()]
        : this.productosActivos().filter((producto) => producto.categoria === categoria);

    return this.ordenar(filtrados, this.ordenSeleccionado());
  });

  seleccionarCategoria(categoria: CategoriaProducto | 'todas'): void {
    this.categoriaSeleccionada.set(categoria);
  }

  cambiarOrden(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as OrdenProductos;
    this.ordenSeleccionado.set(valor);
  }

  esCategoriaActiva(categoria: CategoriaProducto | 'todas'): boolean {
    return this.categoriaSeleccionada() === categoria;
  }

  etiquetaCategoria(categoria: CategoriaProducto | 'todas'): string {
    return categoria === 'todas' ? 'Todos los productos' : categoria;
  }

  private ordenar(productos: Producto[], orden: OrdenProductos): Producto[] {
    const copia = [...productos];
    switch (orden) {
      case 'precio-asc':
        return copia.sort((a, b) => a.precio - b.precio);
      case 'precio-desc':
        return copia.sort((a, b) => b.precio - a.precio);
      case 'nombre':
        return copia.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      default:
        return copia;
    }
  }
}
