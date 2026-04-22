/**
 * 📄 Descrição: GET /api/reports/indicadores — Painel de Indicadores Gerenciais
 * 🧱 Contexto: Bloco 40 — consolida KPIs de DRE, Balanço e DFC
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Next.js App Router, TypeScript
 * 🔍 Dependências: ReportService, withAuth
 * ✅ Revisado: Sim
 *
 * CAMADA: Routes
 * MÓDULO: Reports
 * RESPONSABILIDADE: GET /api/reports/indicadores — Indicadores Gerenciais
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: ReportService.gerarIndicadores, withAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { ReportService } from '@/services/reportService'

const reportService = new ReportService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const now = new Date()
      const inicio =
        searchParams.get('inicio') ||
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const fim =
        searchParams.get('fim') ||
        now.toISOString().slice(0, 10)

      if (!inicio || !fim) {
        return NextResponse.json(
          { error: 'Parâmetros inicio e fim são obrigatórios' },
          { status: 400 }
        )
      }

      const indicadores = await reportService.gerarIndicadores(user.id, inicio, fim)
      return NextResponse.json(indicadores)
    } catch (error) {
      console.error('[api/reports/indicadores GET]', error)
      return NextResponse.json({ error: 'Erro ao gerar indicadores' }, { status: 500 })
    }
  })
}
