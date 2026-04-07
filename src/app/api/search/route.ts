/**
 * 📄 Descrição: Busca global de lançamentos autenticada
 * 🧱 Contexto: Utilizada pelo SearchModal (CTRL+K)
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js, Supabase Auth, Zod
 * 🔍 Dependências: searchService, @supabase/auth-helpers-nextjs
 * ✅ Revisado: Sim
 *
 * CAMADA: Routes
 * MÓDULO: Search
 * RESPONSABILIDADE: Busca global de lançamentos autenticada
 * NÃO DEVE: Conter lógica de busca, aceitar userId externo,
 *            acessar banco diretamente
 * DEPENDE DE: searchService, Zod, Supabase Auth
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth } from '@/middlewares/auth'
import { searchService } from '@/services/searchService'

const querySchema = z.object({
  q: z.string().min(2, 'Termo deve ter pelo menos 2 caracteres').max(100),
})

export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const validation = querySchema.safeParse({ q: searchParams.get('q') })

      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const result = await searchService.search(user.id, validation.data.q)
      return NextResponse.json(result, { status: 200 })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao realizar busca'
      if (message.includes('pelo menos 2 caracteres')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }
      console.error('[api/search] Erro:', error)
      return NextResponse.json({ error: 'Erro ao realizar busca' }, { status: 500 })
    }
  })
}
