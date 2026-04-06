/**
 * CAMADA: Config — MÓDULO: Supabase Admin
 * RESPONSABILIDADE: Cliente Supabase com permissões elevadas (SERVICE_ROLE)
 * ⚠️  USO EXCLUSIVO NO SERVIDOR — nunca importe em componentes/hooks cliente
 * DEPENDE DE: @supabase/supabase-js, SUPABASE_SERVICE_ROLE_KEY (env server-side)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl || !serviceRoleKey) {
  console.warn('[supabaseAdmin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não definidos')
}

export const supabaseAdmin = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (null as any)
