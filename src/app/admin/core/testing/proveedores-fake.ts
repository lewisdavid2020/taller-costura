import { Provider } from '@angular/core';
import { ClienteSupabase, SUPABASE_CLIENTE, SUPABASE_CONFIGURADO } from '../supabase.client';
import { crearSupabaseFalso } from './supabase-fake';

/** Proveedores de TestBed: cliente en memoria, sin conexión al proyecto real. */
export function proveedoresSupabaseFake(): Provider[] {
  return [
    { provide: SUPABASE_CLIENTE, useValue: crearSupabaseFalso() as unknown as ClienteSupabase },
    { provide: SUPABASE_CONFIGURADO, useValue: true },
  ];
}
