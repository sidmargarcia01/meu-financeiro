/**
 * CAMADA: Routes
 * MÓDULO: Reports
 * RESPONSABILIDADE: GET /api/reports/extrato — Extrato de lançamentos por conta/período
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, ReportService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { ReportService } from '@/services/reportService'
import { ReconciliationService } from '@/services/reconciliationService'

const reportService = new ReportService()
const reconciliation = new ReconciliationService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const accountId = searchParams.get('accountId') || undefined
      const inicio = searchParams.get('inicio') || undefined
      const fim = searchParams.get('fim') || undefined

      if (accountId) return NextResponse.json(await reconciliation.getExtrato(user.id,accountId,{dateFrom:inicio,dateTo:fim}))
      return NextResponse.json(await reportService.gerarExtrato(user.id,undefined,inicio,fim))
    } catch (error) {
      console.error('Erro ao gerar extrato:', error)
      return NextResponse.json({ error: 'Erro ao gerar extrato' }, { status: 500 })
    }
  })
}
