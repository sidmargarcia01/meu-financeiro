/**
 * CAMADA: Config
 * MÓDULO: Supabase
 * RESPONSABILIDADE: Configurar e exportar cliente Supabase
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: @supabase/supabase-js
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com permissões elevadas (apenas no servidor)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
