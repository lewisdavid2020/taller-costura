import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { proveedoresSupabaseFake } from '../admin/core/testing/proveedores-fake';
import { ContactComponent } from './contact.component';
import { enlaceWhatsapp, normalizarWhatsapp } from './whatsapp';

describe('utilidades de WhatsApp', () => {
  it('agrega el prefijo colombiano a celulares nacionales', () => {
    expect(normalizarWhatsapp('300 123 4567')).toBe('573001234567');
  });

  it('quita el prefijo internacional 00 y los separadores', () => {
    expect(normalizarWhatsapp('00 1 (415) 555-2671')).toBe('14155552671');
  });

  it('genera un enlace con el número normalizado', () => {
    expect(enlaceWhatsapp('(300) 123-4567')).toBe('https://wa.me/573001234567');
  });
});

describe('ContactComponent', () => {
  it('normaliza el WhatsApp internacional antes de crear el enlace', async () => {
    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [...proveedoresSupabaseFake()],
    }).compileComponents();

    const fixture = TestBed.createComponent(ContactComponent);
    fixture.componentInstance.whatsapp = '+1 (415) 555-2671';

    expect(fixture.componentInstance.enlaceWhatsApp).toContain('https://wa.me/14155552671?text=');
  });
});
