/**
 * CAMADA: Routes
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Endpoints para dashboard e relatórios
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, DashboardService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { dashboardService } from '@/services/dashboardService'

// GET /api/dashboard - Endpoint consolidado do dashboard
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const widget = searchParams.get('widget') || 'all'
      
      switch (widget) {
        case 'saldo':
          const saldo = await dashboardService.getSaldoConsolidado(user.id)
          return NextResponse.json(saldo)
          
        case 'resumo-mensal':
          const mes = searchParams.get('mes') ? parseInt(searchParams.get('mes')!) : undefined
          const ano = searchParams.get('ano') ? parseInt(searchParams.get('ano')!) : undefined
          const resumo = await dashboardService.getResumoMensal(user.id, mes, ano)
          return NextResponse.json(resumo)
          
        case 'fluxo-caixa':
          const meses = searchParams.get('meses') ? parseInt(searchParams.get('meses')!) : 6
          const fluxo = await dashboardService.getFluxoCaixa(user.id, meses)
          return NextResponse.json(fluxo)
          
        case 'lancamentos-proximos':
          const lancamentos = await dashboardService.getLancamentosProximos(user.id)
          return NextResponse.json(lancamentos)
          
        case 'categorias':
          const mesParam = searchParams.get('mes')
          const anoParam = searchParams.get('ano')
          const catMes = mesParam ? parseInt(mesParam) : new Date().getMonth() + 1
          const catAno = anoParam ? parseInt(anoParam) : new Date().getFullYear()
          const categorias = await dashboardService.getDistribuicaoCategorias(user.id, catMes, catAno)
          return NextResponse.json(categorias)
          
        case 'all':
        default:
          // Retorna todos os widgets se não especificado
          const [
            saldoData,
            resumoData,
            fluxoData,
            lancamentosData,
            categoriasData
          ] = await Promise.all([
            dashboardService.getSaldoConsolidado(user.id),
            dashboardService.getResumoMensal(user.id),
            dashboardService.getFluxoCaixa(user.id, 6),
            dashboardService.getLancamentosProximos(user.id),
            dashboardService.getDistribuicaoCategorias(
              user.id,
              new Date().getMonth() + 1,
              new Date().getFullYear()
            )
          ])
          
          return NextResponse.json({
            saldo: saldoData,
            resumoMensal: resumoData,
            fluxoCaixa: fluxoData,
            lancamentosProximos: lancamentosData,
            categorias: categoriasData
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
