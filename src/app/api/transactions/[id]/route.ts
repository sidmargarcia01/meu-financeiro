/**
 * CAMADA: Routes
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Endpoint para obter transação específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, TransactionService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { TransactionService } from '@/services/transactionService'

const transactionService = new TransactionService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const transaction = await transactionService.getTransaction(user.id, params.id)
      
      if (!transaction) {
        return NextResponse.json(
          { error: 'Transação não encontrada' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(transaction)
    } catch (error) {
      console.error('Erro ao obter transação:', error)
      return NextResponse.json(
        { error: 'Erro ao obter transação' },
        { status: 500 }
      )
    }
  })
}
