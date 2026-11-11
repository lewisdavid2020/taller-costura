import { Component, computed, inject } from '@angular/core';
import { CatalogService } from '../admin/core/catalog.service';
import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { ProductCardComponent } from '../product-card/product-card.component';
import { ServiceCardComponent } from '../service-card/service-card.component';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [HeaderComponent, HeroComponent, ProductCardComponent, ServiceCardComponent, ContactComponent],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  private readonly catalogo = inject(CatalogService);

  // Solo se muestran al público los productos marcados como activos en el panel.
  readonly productos = computed(() => this.catalogo.productos().filter((producto) => producto.estado === 'activo'));

  // Cambia aquí el nombre de tu negocio y tu WhatsApp (con código de país, sin + ni espacios).
  nombreTaller = 'Nombre del Taller';
  whatsapp = '00000000000';
  anio = new Date().getFullYear();

  // Datos de las 3 tarjetas. Se muestran todas con el mismo componente ServiceCard.
  servicios = [
    {
      titulo: 'Arreglos y ajustes',
      descripcion: 'Bastas, entalles, cambios de cierres y ajustes precisos para que tus prendas favoritas vuelvan a quedarte perfectas.',
      precio: 'Desde $5',
      etiqueta: 'Ajuste al cuerpo',
      icono: 'straighten',
      beneficios: ['Bastas y dobladillos', 'Cambio de cierres', 'Ajustes de mangas y hombros'],
    },
    {
      titulo: 'Confección a medida',
      descripcion: 'Vestidos, camisas, pantalones y más, confeccionados con tus medidas y a partir de la idea que imaginas.',
      precio: 'Desde $25',
      etiqueta: 'Prenda exclusiva',
      icono: 'draw',
      beneficios: ['Toma de medidas personalizada', 'Prueba de calce', 'Acabados hechos para durar'],
    },
    {
      titulo: 'Uniformes y pedidos por lote',
      descripcion: 'Prendas para empresas, colegios y equipos, con costuras reforzadas y tallas consistentes.',
      precio: 'Cotización por cantidad',
      etiqueta: 'Empresas y equipos',
      icono: 'inventory_2',
      beneficios: ['Precios por volumen', 'Muestra antes de confeccionar', 'Bordados opcionales'],
    },
  ];

  // Lista de nombres para el selector del formulario de contacto.
  get titulosServicios(): string[] {
    return [...new Set([...this.servicios.map((s) => s.titulo), ...this.productos().map((p) => p.nombre)])];
  }
}
