/**
 * 📄 Descrição: Cliente Supabase para uso no servidor
 * 🧱 Contexto: Configuração Supabase para Server Components e API routes
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: Supabase, TypeScript, Node.js
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Não
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseServerInstance: SupabaseClient<any> | null = null

export function getSupabaseServer(): SupabaseClient<any> {
  if (supabaseServerInstance) {
    return supabaseServerInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  }

  supabaseServerInstance = createClient(supabaseUrl, serviceRoleKey)
  return supabaseServerInstance
}

// Alias para compatibilidade
export const supabaseServer = getSupabaseServer()
