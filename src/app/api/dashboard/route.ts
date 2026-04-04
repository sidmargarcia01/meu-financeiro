/**
 * CAMADA: Routes
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Endpoints para dashboard e relatórios
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, DashboardService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { DashboardService } from '@/services/dashboardService'

const dashboardService = new DashboardService()

// GET /api/dashboard/summary - Resumo geral do dashboard
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const type = searchParams.get('type') as 'summary' | 'categories' | 'accounts' | 'recent' | 'evolution' || 'summary'
      
      switch (type) {
        case 'summary':
          const summary = await dashboardService.getDashboardSummary(user.id)
          return NextResponse.json(summary)
          
        case 'categories':
          const categoryType = searchParams.get('categoryType') as 'RECEITA' | 'DESPESA' | undefined
          const categories = await dashboardService.getCategorySummary(user.id, categoryType)
          return NextResponse.json(categories)
          
        case 'accounts':
          const accounts = await dashboardService.getAccountSummary(user.id)
          return NextResponse.json(accounts)
          
        case 'recent':
          const limit = parseInt(searchParams.get('limit') || '10')
          const recent = await dashboardService.getRecentTransactions(user.id, limit)
          return NextResponse.json(recent)
          
        case 'evolution':
          const months = parseInt(searchParams.get('months') || '12')
          const evolution = await dashboardService.getMonthlyEvolution(user.id, months)
          return NextResponse.json(evolution)
          
        default:
          // Retorna todos os dados se não especificado
          const [summaryData, categoriesData, accountsData, recentData] = await Promise.all([
            dashboardService.getDashboardSummary(user.id),
            dashboardService.getCategorySummary(user.id),
            dashboardService.getAccountSummary(user.id),
            dashboardService.getRecentTransactions(user.id, 5)
          ])
          
          return NextResponse.json({
            summary: summaryData,
            categories: categoriesData,
            accounts: accountsData,
            recent: recentData
          })
      }
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error)
      return NextResponse.json(
        { error: 'Erro ao obter dados do dashboard' },
        { status: 500 }
      )
    }
  })
}
