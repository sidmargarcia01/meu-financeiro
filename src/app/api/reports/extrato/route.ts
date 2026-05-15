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
import { AccountService } from '@/services/accountService'

const reportService = new ReportService()
const accountService = new AccountService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const accountId = searchParams.get('accountId') || undefined
      const inicio = searchParams.get('inicio') || undefined
      const fim = searchParams.get('fim') || undefined

      const linhas = await reportService.gerarExtrato(user.id, accountId, inicio, fim)

      if (!accountId) {
        return NextResponse.json(linhas)
      }

      const account = await accountService.findById(user.id, accountId)
      const { projected, confirmed } = await accountService.calculateBalance(accountId, user.id)

      const transactions = linhas.map(l => ({
        id: l.id,
        description: l.descricao,
        amount: Math.abs(l.valor),
        type: l.tipo,
        status: l.status,
        due_date: l.data,
        category: l.categoria ? { name: l.categoria } : undefined,
      }))

      return NextResponse.json({
        transactions,
        saldo_projetado: projected,
        saldo_confirmado: confirmed,
        account: {
          id: account.id,
          name: account.name,
          type: account.type,
        },
      })
    } catch (error) {
      console.error('Erro ao gerar extrato:', error)
      return NextResponse.json({ error: 'Erro ao gerar extrato' }, { status: 500 })
    }
  })
}
