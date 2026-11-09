import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { CATEGORIAS_PRODUCTO, ICONO_CATEGORIA } from '../../core/catalogos';
import { CategoriaProducto, EstadoProducto, Producto } from '../../core/modelos';
import { formatearFecha, formatearNumero, formatearPrecio } from '../../core/formato';
import { ToastService } from '../../core/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

type FiltroEstado = 'todos' | EstadoProducto;

const POR_PAGINA = 6;

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './products-list.component.html',
})
export class ProductsListComponent {
  private readonly catalogo = inject(CatalogService);
  private readonly toast = inject(ToastService);

  readonly productos = this.catalogo.productos;
  readonly categorias = CATEGORIAS_PRODUCTO;

  readonly busqueda = signal('');
  readonly categoria = signal<CategoriaProducto | 'todas'>('todas');
  readonly estado = signal<FiltroEstado>('todos');
  readonly pagina = signal(1);
  readonly productoAEliminar = signal<Producto | null>(null);

  @ViewChild('confirmar') private confirmar!: ConfirmDialogComponent;

  readonly filtrados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const categoria = this.categoria();
    const estado = this.estado();

    return this.productos().filter((producto) => {
      const coincideTexto =
        texto === '' ||
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);
      const coincideCategoria = categoria === 'todas' || producto.categoria === categoria;
      const coincideEstado = estado === 'todos' || producto.estado === estado;
      return coincideTexto && coincideCategoria && coincideEstado;
    });
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)));

  readonly paginas = computed(() => Array.from({ length: this.totalPaginas() }, (_, indice) => indice + 1));

  readonly visibles = computed(() => {
    const inicio = (this.pagina() - 1) * POR_PAGINA;
    return this.filtrados().slice(inicio, inicio + POR_PAGINA);
  });

  readonly resumen = computed(() => {
    const total = this.filtrados().length;
    if (total === 0) return 'Sin resultados';
    const inicio = (this.pagina() - 1) * POR_PAGINA + 1;
    const fin = Math.min(this.pagina() * POR_PAGINA, total);
    return `Mostrando ${inicio}–${fin} de ${total} productos`;
  });

  readonly sinProductos = computed(() => this.productos().length === 0);
  readonly sinResultados = computed(() => !this.sinProductos() && this.filtrados().length === 0);

  cambiarBusqueda(evento: Event): void {
    this.busqueda.set((evento.target as HTMLInputElement).value);
    this.pagina.set(1);
  }

  cambiarCategoria(evento: Event): void {
    this.categoria.set((evento.target as HTMLSelectElement).value as CategoriaProducto | 'todas');
    this.pagina.set(1);
  }

  cambiarEstado(estado: FiltroEstado): void {
    this.estado.set(estado);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.categoria.set('todas');
    this.estado.set('todos');
    this.pagina.set(1);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas()) this.pagina.set(pagina);
  }

  pedirEliminar(producto: Producto): void {
    this.productoAEliminar.set(producto);
    this.confirmar.abrir();
  }

  eliminar(): void {
    const producto = this.productoAEliminar();
    if (!producto) return;
    this.catalogo.eliminar(producto.id);
    this.productoAEliminar.set(null);
    this.toast.mostrar(`«${producto.nombre}» se eliminó del catálogo.`);
    if (this.pagina() > this.totalPaginas()) this.pagina.set(this.totalPaginas());
  }

  icono(categoria: CategoriaProducto): string {
    return ICONO_CATEGORIA[categoria];
  }

  formatearPrecio(valor: number): string {
    return formatearPrecio(valor);
  }

  formatearFecha(valor: string): string {
    return formatearFecha(valor);
  }

  formatearNumero(valor: number): string {
    return formatearNumero(valor);
  }
}
