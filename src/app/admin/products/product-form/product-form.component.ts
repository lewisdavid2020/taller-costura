import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CatalogService } from '../../core/catalog.service';
import { CATEGORIAS_PRODUCTO } from '../../core/catalogos';
import { CategoriaProducto, EstadoProducto, Producto } from '../../core/modelos';
import { ToastService } from '../../core/toast.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

const MAX_FOTOS = 5;

async function leerDataUrl(archivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    lector.readAsDataURL(archivo);
  });
}

async function cargarImagen(fuente: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error('El archivo no es una imagen válida.'));
    imagen.src = fuente;
  });
}

async function optimizarImagen(archivo: File): Promise<string> {
  if (archivo.type === 'image/svg+xml') return leerDataUrl(archivo);

  const fuente = await leerDataUrl(archivo);
  const imagen = await cargarImagen(fuente);
  const maximo = 1100;
  const escala = Math.min(1, maximo / Math.max(imagen.width, imagen.height));
  const ancho = Math.max(1, Math.round(imagen.width * escala));
  const alto = Math.max(1, Math.round(imagen.height * escala));

  const lienzo = document.createElement('canvas');
  lienzo.width = ancho;
  lienzo.height = alto;
  const contexto = lienzo.getContext('2d');
  if (!contexto) return fuente;
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, ancho, alto);
  contexto.drawImage(imagen, 0, 0, ancho, alto);
  return lienzo.toDataURL('image/jpeg', 0.82);
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PageHeaderComponent, ConfirmDialogComponent],
  templateUrl: './product-form.component.html',
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly catalogo = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  private readonly id = this.ruta.snapshot.paramMap.get('id');
  readonly original: Producto | undefined = this.id ? this.catalogo.obtener(this.id) : undefined;

  readonly esEdicion = Boolean(this.id);
  readonly noEncontrado = signal(this.esEdicion && !this.original);
  readonly categorias = CATEGORIAS_PRODUCTO;
  readonly imagenes = signal<string[]>(this.original ? [...this.original.imagenes] : []);
  readonly procesandoFotos = signal(false);
  readonly arrastrando = signal(false);
  readonly errorFormulario = signal('');

  @ViewChild('archivoInput') private archivoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmar') private confirmar!: ConfirmDialogComponent;

  readonly formulario = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]),
    descripcion: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(20),
      Validators.maxLength(600),
    ]),
    categoria: this.fb.nonNullable.control<CategoriaProducto | ''>('', [Validators.required]),
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    estado: this.fb.nonNullable.control<EstadoProducto>('activo', [Validators.required]),
  });

  readonly titulo = computed(() => (this.esEdicion ? 'Editar producto' : 'Agregar producto'));
  readonly descripcionPagina = computed(() =>
    this.esEdicion
      ? 'Actualiza la información, las fotos y la visibilidad de esta pieza.'
      : 'Completa la ficha para sumar una nueva pieza al catálogo del taller.',
  );

  constructor() {
    if (this.original) {
      this.formulario.patchValue({
        nombre: this.original.nombre,
        descripcion: this.original.descripcion,
        categoria: this.original.categoria,
        precio: this.original.precio,
        estado: this.original.estado,
      });
    }
  }

  get nombre() {
    return this.formulario.controls.nombre;
  }

  get descripcion() {
    return this.formulario.controls.descripcion;
  }

  get categoria() {
    return this.formulario.controls.categoria;
  }

  get precio() {
    return this.formulario.controls.precio;
  }

  get estado() {
    return this.formulario.controls.estado;
  }

  get esActivo(): boolean {
    return this.estado.value === 'activo';
  }

  mensajeNombre(): string {
    if (!this.nombre.touched || this.nombre.valid) return '';
    if (this.nombre.hasError('required')) return 'Escribe el nombre del producto.';
    if (this.nombre.hasError('minlength')) return 'El nombre debe tener al menos 3 caracteres.';
    if (this.nombre.hasError('maxlength')) return 'El nombre no puede pasar de 80 caracteres.';
    return 'Revisa este campo.';
  }

  mensajeDescripcion(): string {
    if (!this.descripcion.touched || this.descripcion.valid) return '';
    if (this.descripcion.hasError('required')) return 'Describe el producto para el catálogo.';
    if (this.descripcion.hasError('minlength')) return 'La descripción debe tener al menos 20 caracteres.';
    if (this.descripcion.hasError('maxlength')) return 'La descripción no puede pasar de 600 caracteres.';
    return 'Revisa este campo.';
  }

  mensajeCategoria(): string {
    if (!this.categoria.touched || this.categoria.valid) return '';
    return 'Selecciona una categoría.';
  }

  mensajePrecio(): string {
    if (!this.precio.touched || this.precio.valid) return '';
    if (this.precio.hasError('required')) return 'Escribe el precio del producto.';
    if (this.precio.hasError('min')) return 'El precio debe ser mayor que cero.';
    return 'Revisa este campo.';
  }

  cambiarVisibilidad(evento: Event): void {
    const activo = (evento.target as HTMLInputElement).checked;
    this.estado.setValue(activo ? 'activo' : 'oculto');
    this.estado.markAsDirty();
  }

  abrirSelectorFotos(): void {
    this.archivoInput.nativeElement.click();
  }

  async alSeleccionarFotos(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    if (entrada.files && entrada.files.length > 0) {
      await this.agregarArchivos([...entrada.files]);
    }
    entrada.value = '';
  }

  alArrastrar(evento: DragEvent): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.arrastrando.set(true);
  }

  alSalirArrastre(evento: DragEvent): void {
    evento.preventDefault();
    evento.stopPropagation();
    this.arrastrando.set(false);
  }

  async alSoltar(evento: DragEvent): Promise<void> {
    evento.preventDefault();
    evento.stopPropagation();
    this.arrastrando.set(false);
    if (evento.dataTransfer?.files.length) {
      await this.agregarArchivos([...evento.dataTransfer.files]);
    }
  }

  quitarFoto(indice: number): void {
    this.imagenes.update((fotos) => fotos.filter((_, posicion) => posicion !== indice));
  }

  async agregarArchivos(archivos: File[]): Promise<void> {
    const disponibles = MAX_FOTOS - this.imagenes().length;
    if (disponibles <= 0) {
      this.toast.mostrar(`Puedes adjuntar hasta ${MAX_FOTOS} fotos por producto.`, 'info');
      return;
    }

    const soloImagenes = archivos.filter((archivo) => archivo.type.startsWith('image/'));
    if (soloImagenes.length !== archivos.length) {
      this.toast.mostrar('Algunos archivos no son imágenes y se omitieron.', 'error');
    }
    if (soloImagenes.length === 0) return;

    const seleccionados = soloImagenes.slice(0, disponibles);
    if (seleccionados.length < soloImagenes.length) {
      this.toast.mostrar(`Solo se agregaron ${disponibles} fotos; el máximo es ${MAX_FOTOS}.`, 'info');
    }

    this.procesandoFotos.set(true);
    for (const archivo of seleccionados) {
      if (archivo.size > 8 * 1024 * 1024) {
        this.toast.mostrar(`«${archivo.name}» pesa más de 8 MB y no se agregó.`, 'error');
        continue;
      }
      try {
        const optimizada = await optimizarImagen(archivo);
        this.imagenes.update((fotos) => [...fotos, optimizada]);
      } catch {
        this.toast.mostrar(`No pudimos procesar «${archivo.name}». Prueba con otra imagen.`, 'error');
      }
    }
    this.procesandoFotos.set(false);
  }

  guardar(): void {
    this.errorFormulario.set('');

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorFormulario.set('Revisa los campos marcados antes de guardar el producto.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim(),
      categoria: valores.categoria as CategoriaProducto,
      precio: Number(valores.precio),
      imagenes: this.imagenes(),
      estado: valores.estado,
    };

    if (this.esEdicion && this.id) {
      const actualizado = this.catalogo.actualizar(this.id, datos);
      if (!actualizado) {
        this.errorFormulario.set('No encontramos este producto. Puede que se haya eliminado.');
        return;
      }
      this.toast.mostrar(`«${actualizado.nombre}» se actualizó correctamente.`);
      void this.router.navigate(['/admin/productos']);
      return;
    }

    const creado = this.catalogo.crear(datos);
    this.toast.mostrar(`«${creado.nombre}» se agregó al catálogo.`);
    void this.router.navigate(['/admin/productos']);
  }

  pedirEliminar(): void {
    this.confirmar.abrir();
  }

  eliminar(): void {
    if (!this.id) return;
    const producto = this.original;
    this.catalogo.eliminar(this.id);
    this.toast.mostrar(`«${producto?.nombre ?? 'El producto'}» se eliminó del catálogo.`);
    void this.router.navigate(['/admin/productos']);
  }
}
