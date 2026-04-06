/**
 * CAMADA: Config
 * MÓDULO: Supabase
 * RESPONSABILIDADE: Configurar e exportar cliente Supabase
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

if (typeof window === 'undefined' && (
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder-anon-key'
)) {
  console.warn('[supabase] Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
