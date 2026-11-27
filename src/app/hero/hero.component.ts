import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  @Input() nombre = 'Julia Rosa Creaciones';
  @Input() totalServicios = 0;
  @Input() totalProductos = 0;
}
