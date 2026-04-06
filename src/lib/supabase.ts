/**
 * CAMADA: Config
 * MÓDULO: Supabase
 * RESPONSABILIDADE: Configurar e exportar cliente Supabase
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: @supabase/supabase-js
 */

import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
