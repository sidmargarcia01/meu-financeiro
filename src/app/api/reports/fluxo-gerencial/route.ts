/**
 * 📄 Descrição: Endpoint GET /api/reports/fluxo-gerencial
 * 🧱 Contexto: Módulo Relatórios — matriz mensal gerencial de fluxo de caixa
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: Next.js App Router, Zod, JWT
 * 🔍 Dependências: fluxoGerencialService, withAuth
 * ✅ Revisado: Sim
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { fluxoGerencialService } from '@/services/fluxoGerencialService'
import { z } from 'zod'

const regexData = /^\d{4}-\d{2}-\d{2}$/

const fluxoGerencialSchema = z.object({
  inicio: z.string().regex(regexData, 'Formato de data inválido (YYYY-MM-DD)'),
  fim: z.string().regex(regexData, 'Formato de data inválido (YYYY-MM-DD)'),
  regime: z.enum(['CAIXA', 'COMPETENCIA']).optional().default('CAIXA'),
})

function contarMeses(inicio: string, fim: string): number {
  const [anoI, mesI] = inicio.split('-').map(Number)
  const [anoF, mesF] = fim.split('-').map(Number)
  return (anoF - anoI) * 12 + (mesF - mesI) + 1
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)

      const queryParams = {
        inicio: searchParams.get('inicio') || '',
        fim: searchParams.get('fim') || '',
        regime: searchParams.get('regime') || 'CAIXA',
      }

      const validation = fluxoGerencialSchema.safeParse(queryParams)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Parâmetros inválidos', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { inicio, fim, regime } = validation.data

      if (inicio > fim) {
        return NextResponse.json(
          { error: 'Data de início deve ser anterior ou igual à data de fim' },
          { status: 400 }
        )
      }

      const meses = contarMeses(inicio, fim)
      if (meses > 24) {
        return NextResponse.json(
          { error: 'Período máximo permitido: 24 meses' },
          { status: 400 }
        )
      }

      const fluxo = await fluxoGerencialService.gerarMatriz(user.id, inicio, fim, regime)
      return NextResponse.json(fluxo)
    } catch (error) {
      console.error('Erro ao gerar fluxo de caixa gerencial:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
