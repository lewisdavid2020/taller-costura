import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { WorkshopService } from '../core/workshop.service';
import { iniciales } from '../core/formato';
import { ToastStackComponent } from '../shared/toast-stack.component';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
  icono: string;
  exacto?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastStackComponent],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly taller = inject(WorkshopService);

  readonly sesion = this.auth.sesion;
  readonly tallerNombre = this.taller.datos;

  readonly enlaces: EnlaceNavegacion[] = [
    { ruta: '/admin/resumen', etiqueta: 'Resumen', icono: 'space_dashboard', exacto: true },
    { ruta: '/admin/productos', etiqueta: 'Productos', icono: 'checkroom' },
    { ruta: '/admin/pedidos', etiqueta: 'Pedidos', icono: 'receipt_long' },
    { ruta: '/admin/clientes', etiqueta: 'Clientes', icono: 'group' },
    { ruta: '/admin/configuracion', etiqueta: 'Configuración', icono: 'tune' },
  ];

  iniciales(nombre: string): string {
    return iniciales(nombre);
  }

  cerrarSesion(): void {
    this.auth.cerrarSesion();
    void this.router.navigate(['/admin/login'], { queryParams: { sesion: 'cerrada' } });
  }
}
