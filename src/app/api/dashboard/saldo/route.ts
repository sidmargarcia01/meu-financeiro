/**
 * CAMADA: Routes
 * MÓDULO: Dashboard - Widget Saldo Consolidado
 * RESPONSABILIDADE: Retornar saldo projetado e confirmado de todas as contas
 * NÃO DEVE: Conter lógica de cálculo, acessar banco diretamente
 * DEPENDE DE: dashboardService, middleware de autenticação
 */

import { NextRequest, NextResponse } from 'next/server'
import { dashboardService } from '@/services/dashboardService'
import { withAuth } from '@/middlewares/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (request, user) => {
    try {
      // Buscar saldo consolidado
      const saldo = await dashboardService.getSaldoConsolidado(user.id)

      return NextResponse.json(saldo)
    } catch (error) {
      console.error('Erro ao buscar saldo consolidado:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }
  })
}
