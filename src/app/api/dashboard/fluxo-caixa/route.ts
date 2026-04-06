/**
 * CAMADA: Routes
 * MÓDULO: Dashboard - Widget Fluxo de Caixa
 * RESPONSABILIDADE: Retornar dados de fluxo de caixa dos últimos meses
 * NÃO DEVE: Conter lógica de cálculo, acessar banco diretamente
 * DEPENDE DE: dashboardService, middleware de autenticação, validação Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboardService'
import { withAuth } from '@/middlewares/auth'
import { z } from 'zod'

// Schema de validação para query params
const fluxoCaixaSchema = z.object({
  meses: z.coerce.number().min(1).max(24).optional().default(6)
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      // Extrair e validar query params
      const { searchParams } = new URL(request.url)
      const queryParams = {
        meses: searchParams.get('meses')
      }

      const validation = fluxoCaixaSchema.safeParse(queryParams)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Parâmetros inválidos', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { meses } = validation.data

      // Buscar fluxo de caixa
      const fluxo = await dashboardService.getFluxoCaixa(user.id, meses)

      return NextResponse.json(fluxo)
    } catch (error) {
      console.error('Erro ao buscar fluxo de caixa:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
