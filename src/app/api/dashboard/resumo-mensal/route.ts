/**
 * CAMADA: Routes
 * MÓDULO: Dashboard - Widget Resumo Mensal
 * RESPONSABILIDADE: Retornar resumo financeiro do mês com comparativo
 * NÃO DEVE: Conter lógica de cálculo, acessar banco diretamente
 * DEPENDE DE: dashboardService, middleware de autenticação, validação Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboardService'
import { withAuth } from '@/middlewares/auth'
import { z } from 'zod'

// Schema de validação para query params
const resumoMensalSchema = z.object({
  mes: z.coerce.number().min(1).max(12).optional().nullable(),
  ano: z.coerce.number().min(2020).max(2100).optional().nullable()
}).transform(data => ({
  mes: data.mes ?? undefined,
  ano: data.ano ?? undefined
}))

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      // Extrair e validar query params
      const { searchParams } = new URL(request.url)
      const queryParams = {
        mes: searchParams.get('mes'),
        ano: searchParams.get('ano')
      }

      const validation = resumoMensalSchema.safeParse(queryParams)
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Parâmetros inválidos', details: validation.error.errors },
          { status: 400 }
        )
      }

      const { mes, ano } = validation.data

      // Buscar resumo mensal
      const resumo = await dashboardService.getResumoMensal(user.id, mes, ano)

      return NextResponse.json(resumo)
    } catch (error) {
      console.error('Erro ao buscar resumo mensal:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
