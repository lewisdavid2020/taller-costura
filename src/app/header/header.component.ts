import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../admin/core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  // Llega desde LandingComponent: <app-header [nombre]="nombreTaller" />
  @Input() nombre = 'Julia Rosa Creaciones';

  private readonly auth = inject(AuthService);

  // Si ya hay una sesión abierta, el botón lleva directo al panel.
  readonly rutaAcceso = computed(() => (this.auth.autenticado() ? '/admin/resumen' : '/admin/login'));
  readonly etiquetaAcceso = computed(() => (this.auth.autenticado() ? 'Dashboard' : 'Iniciar sesión'));

  menuAbierto = false;

  get partesNombre(): string[] {
    return this.nombre.split('&').map((parte) => parte.trim());
  }

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }
}
