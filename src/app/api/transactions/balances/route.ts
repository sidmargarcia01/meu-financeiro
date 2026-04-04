/**
 * CAMADA: Routes
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Endpoint para obter saldos por conta
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, TransactionService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { TransactionService } from '@/services/transactionService'

const transactionService = new TransactionService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const balances = await transactionService.calculateBalances(user.id)
      return NextResponse.json(balances)
    } catch (error) {
      console.error('Erro ao calcular saldos:', error)
      return NextResponse.json(
        { error: 'Erro ao calcular saldos' },
        { status: 500 }
      )
    }
  })
}
