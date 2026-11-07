import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css',
})
export class HeroComponent {
  // Llega desde AppComponent: <app-hero [nombre]="nombreTaller" />
  @Input() nombre = 'Nombre del Taller';
}
