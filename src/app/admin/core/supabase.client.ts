import { InjectionToken } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

export const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseConfigurado =
  Boolean(environment.supabaseUrl) &&
  Boolean(environment.supabaseAnonKey) &&
  environment.supabaseAnonKey !== 'PEGA_AQUI_TU_SUPABASE_ANON_KEY';

export type ClienteSupabase = typeof supabase;

/** Se inyecta en los servicios para poder sustituirlo en las pruebas. */
export const SUPABASE_CLIENTE = new InjectionToken<ClienteSupabase>('SUPABASE_CLIENTE', {
  providedIn: 'root',
  factory: () => supabase,
});

export const SUPABASE_CONFIGURADO = new InjectionToken<boolean>('SUPABASE_CONFIGURADO', {
  providedIn: 'root',
  factory: () => supabaseConfigurado,
});
