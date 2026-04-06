/**
 * CAMADA: Routes
 * MÓDULO: Dashboard - Widget Lançamentos Próximos
 * RESPONSABILIDADE: Retornar lançamentos próximos ao vencimento
 * NÃO DEVE: Conter lógica de cálculo, acessar banco diretamente
 * DEPENDE DE: dashboardService, middleware de autenticação
 */

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboardService'
import { withAuth } from '@/middlewares/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      // Buscar lançamentos próximos
      const lancamentos = await dashboardService.getLancamentosProximos(user.id)

      return NextResponse.json(lancamentos)
    } catch (error) {
      console.error('Erro ao buscar lançamentos próximos:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
