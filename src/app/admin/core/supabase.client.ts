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