import { Injectable, computed, signal } from '@angular/core';
import { supabase, supabaseConfigurado } from './supabase.client';
import { CategoriaProducto, EstadoProducto, Producto } from './modelos';

interface ProductoFila {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: CategoriaProducto;
  precio: number | string;
  imagenes: string[] | null;
  estado: EstadoProducto;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly productosState = signal<Producto[]>([]);
  private readonly cargandoState = signal(false);

  readonly productos = this.productosState.asReadonly();
  readonly cargando = this.cargandoState.asReadonly();
  readonly total = computed(() => this.productosState().length);
  readonly activos = computed(() => this.productosState().filter((p) => p.estado === 'activo').length);
  readonly ocultos = computed(() => this.productosState().filter((p) => p.estado === 'oculto').length);

  constructor() {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    if (!supabaseConfigurado) return;
    this.cargandoState.set(true);
    const { data, error } = await supabase
      .from('products')
      .select('id,nombre,descripcion,categoria,precio,imagenes,estado,created_at')
      .order('created_at', { ascending: false });

    this.cargandoState.set(false);
    if (error || !data) return;
    this.productosState.set(data.map((fila) => this.mapearProducto(fila as ProductoFila)));
  }

  obtener(id: string): Producto | undefined {
    return this.productosState().find((p) => p.id === id);
  }

  async crear(datos: Omit<Producto, 'id' | 'creadoEn'>): Promise<Producto | null> {
    if (!supabaseConfigurado) return null;
    const imagenes = await this.prepararImagenes(datos.imagenes);
    const { data, error } = await supabase
      .from('products')
      .insert({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        categoria: datos.categoria,
        precio: datos.precio,
        imagenes,
        estado: datos.estado,
      })
      .select('id,nombre,descripcion,categoria,precio,imagenes,estado,created_at')
      .single();

    if (error || !data) return null;
    const producto = this.mapearProducto(data as ProductoFila);
    this.productosState.update((productos) => [producto, ...productos.filter((p) => p.id !== producto.id)]);
    return producto;
  }

  async actualizar(id: string, datos: Omit<Producto, 'id' | 'creadoEn'>): Promise<Producto | null> {
    if (!supabaseConfigurado) return null;
    const imagenes = await this.prepararImagenes(datos.imagenes);
    const { data, error } = await supabase
      .from('products')
      .update({
        nombre: datos.nombre.trim(),
        descripcion: datos.descripcion.trim(),
        categoria: datos.categoria,
        precio: datos.precio,
        imagenes,
        estado: datos.estado,
      })
      .eq('id', id)
      .select('id,nombre,descripcion,categoria,precio,imagenes,estado,created_at')
      .single();

    if (error || !data) return null;
    const producto = this.mapearProducto(data as ProductoFila);
    this.productosState.update((productos) => productos.map((p) => (p.id === id ? producto : p)));
    return producto;
  }

  async eliminar(id: string): Promise<boolean> {
    if (!supabaseConfigurado) return false;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return false;
    this.productosState.update((productos) => productos.filter((p) => p.id !== id));
    return true;
  }

  private async prepararImagenes(imagenes: string[]): Promise<string[]> {
    const resultado: string[] = [];
    for (let i = 0; i < imagenes.length; i++) {
      const imagen = imagenes[i];
      if (!imagen.startsWith('data:')) {
        resultado.push(imagen);
        continue;
      }
      const url = await this.subirImagen(imagen, i);
      resultado.push(url ?? imagen);
    }
    return resultado;
  }

  private async subirImagen(dataUrl: string, indice: number): Promise<string | null> {
    const archivo = this.dataUrlAArchivo(dataUrl, indice);
    if (!archivo) return null;
    const ruta = `productos/${Date.now()}-${indice}-${Math.random().toString(36).slice(2, 10)}.${archivo.ext}`;
    const { error } = await supabase.storage.from('product-images').upload(ruta, archivo.blob, {
      contentType: archivo.mime,
      upsert: false,
    });
    if (error) return null;
    const { data } = supabase.storage.from('product-images').getPublicUrl(ruta);
    return data.publicUrl;
  }

  private dataUrlAArchivo(dataUrl: string, indice: number): { blob: Blob; mime: string; ext: string } | null {
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
    if (!match) return null;
    const mime = match[1];
    const binario = atob(match[2]);
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg').replace('svg+xml', 'svg') || 'jpg';
    return { blob: new Blob([bytes], { type: mime }), mime, ext };
  }

  private mapearProducto(fila: ProductoFila): Producto {
    return {
      id: fila.id,
      nombre: fila.nombre,
      descripcion: fila.descripcion,
      categoria: fila.categoria,
      precio: Number(fila.precio),
      imagenes: Array.isArray(fila.imagenes) ? fila.imagenes : [],
      estado: fila.estado,
      creadoEn: fila.created_at,
    };
  }
}