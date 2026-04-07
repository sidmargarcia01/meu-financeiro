/**
 * 📄 Descrição: Encerrar sessão do usuário via Supabase
 * 🧱 Contexto: Chamado pelo menu de perfil no Header
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js, Supabase Auth
 * 🔍 Dependências: @supabase/auth-helpers-nextjs
 * ✅ Revisado: Sim
 *
 * CAMADA: Routes
 * MÓDULO: Auth
 * RESPONSABILIDADE: Encerrar sessão do usuário via Supabase
 * NÃO DEVE: Conter lógica de negócio, acessar outros dados do usuário
 * DEPENDE DE: Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, user) => {
    try {
      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.signOut(user.id)
      }
      return NextResponse.json({ message: 'Sessão encerrada' }, { status: 200 })
    } catch (error) {
      console.error('[api/auth/logout] Erro:', error)
      return NextResponse.json({ error: 'Erro ao encerrar sessão' }, { status: 500 })
    }
  })
}
