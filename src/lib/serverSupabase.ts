/**
 * 📄 Descrição: Cliente Supabase para uso no servidor
 * 🧱 Contexto: Configuração Supabase para Server Components e API routes
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-04
 * ⚙️ Tecnologias: Supabase, TypeScript, Node.js
 * 🔍 Dependências: @supabase/supabase-js
 * ✅ Revisado: Não
 */

import { createClient } from '@supabase/supabase-js'

export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const supabaseServer = createServerSupabaseClient()
