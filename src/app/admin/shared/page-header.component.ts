import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div class="page-header__texto">
        <p class="adm-eyebrow">{{ eyebrow }}</p>
        <h1>{{ titulo }}</h1>
        @if (descripcion) {
          <p class="page-header__descripcion">{{ descripcion }}</p>
        }
      </div>
      <div class="page-header__acciones">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .page-header__texto { max-width: 46rem; }

    .page-header h1 {
      margin: 0.15rem 0 0;
      color: var(--adm-tinta);
      font-family: var(--adm-fuente-titulos);
      font-size: clamp(1.65rem, 3.2vw, 2.25rem);
      line-height: 1.12;
      letter-spacing: -0.035em;
    }

    .page-header__descripcion {
      margin: 0.45rem 0 0;
      color: var(--adm-gris-oscuro);
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .page-header__acciones {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
    }
  `,
})
export class PageHeaderComponent {
  @Input({ required: true }) titulo = '';
  @Input() eyebrow = '';
  @Input() descripcion = '';
}
