/**
 * CAMADA: Config — MÓDULO: Supabase Admin
 * RESPONSABILIDADE: Cliente Supabase com permissões elevadas (SERVICE_ROLE)
 * ⚠️  USO EXCLUSIVO NO SERVIDOR — nunca importe em componentes/hooks cliente
 * DEPENDE DE: @supabase/supabase-js, SUPABASE_SERVICE_ROLE_KEY (env server-side)
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseAdminInstance: SupabaseClient<any> | null = null

export function getSupabaseAdmin(): SupabaseClient<any> {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[supabaseAdmin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos')
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  }

  supabaseAdminInstance = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return supabaseAdminInstance
}

