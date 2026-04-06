/**
 * CAMADA: Routes
 * MÓDULO: Reports
 * RESPONSABILIDADE: GET /api/reports/dre — Demonstrativo de Resultado do Exercício
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, ReportService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { ReportService } from '@/services/reportService'

const reportService = new ReportService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const inicio = searchParams.get('inicio') || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
      const fim = searchParams.get('fim') || new Date().toISOString().slice(0, 10)
      const regime = (searchParams.get('regime') || 'CAIXA') as 'CAIXA' | 'COMPETENCIA'

      const dre = await reportService.gerarDRE(user.id, inicio, fim, regime)
      return NextResponse.json(dre)
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao gerar DRE' }, { status: 500 })
    }
  })
}
