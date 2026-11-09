import { Component, Input, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../admin/core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  // Llega desde AppComponent: <app-header [nombre]="nombreTaller" />
  @Input() nombre = 'Nombre del Taller';

  private readonly auth = inject(AuthService);

  // Si ya hay una sesión abierta, el botón lleva directo al panel.
  readonly rutaAcceso = computed(() => (this.auth.autenticado() ? '/admin/resumen' : '/admin/login'));
  readonly etiquetaAcceso = computed(() => (this.auth.autenticado() ? 'Dashboard' : 'Iniciar sesión'));
  readonly iconoAcceso = computed(() => (this.auth.autenticado() ? 'space_dashboard' : 'lock'));

  menuAbierto = false;

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }
}
