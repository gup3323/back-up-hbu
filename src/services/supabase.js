import { createClient } from '@supabase/supabase-js';

// As chaves são puxadas das variáveis de ambiente (Vite usa import.meta.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verifica se as chaves existem para não quebrar o app silenciosamente
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Credenciais do Supabase não encontradas no arquivo .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);