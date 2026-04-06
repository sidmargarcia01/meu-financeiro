/**
 * CAMADA: Routes
 * MÓDULO: Reports
 * RESPONSABILIDADE: GET /api/reports/dfc — Demonstrativo de Fluxo de Caixa
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
      const inicio = searchParams.get('inicio') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
      const fim = searchParams.get('fim') || new Date().toISOString().slice(0, 10)

      const dfc = await reportService.gerarDFC(user.id, inicio, fim)
      return NextResponse.json(dfc)
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao gerar DFC' }, { status: 500 })
    }
  })
}
