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

const reportService = new ReportService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const accountId = searchParams.get('accountId') || undefined
      const inicio = searchParams.get('inicio') || undefined
      const fim = searchParams.get('fim') || undefined

      const extrato = await reportService.gerarExtrato(user.id, accountId, inicio, fim)
      return NextResponse.json(extrato)
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao gerar extrato' }, { status: 500 })
    }
  })
}
