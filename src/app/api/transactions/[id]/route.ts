/**
 * CAMADA: Routes
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Endpoints GET | PUT | DELETE | PATCH para transação específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, TransactionService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { TransactionService } from '@/services/transactionService'
import { updateTransactionSchema } from '@/models/transaction'

const transactionService = new TransactionService()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      const transaction = await transactionService.getTransaction(user.id, id)
      if (!transaction) {
        return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
      }
      return NextResponse.json(transaction)
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao obter transação' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, updateTransactionSchema, async (req, data) => {
      try {
        const { id } = await params
        const transaction = await transactionService.updateTransaction(user.id, id, data)
        return NextResponse.json(transaction)
      } catch (error: any) {
        if (error.message?.includes('não encontrada')) {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        return NextResponse.json({ error: 'Erro ao atualizar transação' }, { status: 500 })
      }
    })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      await transactionService.deleteTransaction(user.id, id)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro ao excluir transação' }, { status: 500 })
    }
  })
}

// PATCH /api/transactions/[id] — ação semântica via ?action=confirm|reconcile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      const { searchParams } = new URL(req.url)
      const action = searchParams.get('action')

      if (action === 'confirm') {
        const transaction = await transactionService.confirmTransaction(user.id, id)
        return NextResponse.json(transaction)
      }

      if (action === 'reconcile') {
        let body: any = {}
        try {
          body = await req.json()
        } catch (parseErr) {
          console.error('[PATCH reconcile] Falha ao parsear body:', parseErr)
        }
        console.log('[PATCH reconcile] body:', JSON.stringify(body))
        const transaction = await transactionService.reconcileTransaction(user.id, id, {
          paymentDate: body.paymentDate,
          amount: body.amount !== undefined ? Number(body.amount) : undefined,
          accountId: body.accountId,
          notes: body.notes,
        })
        return NextResponse.json(transaction)
      }

      return NextResponse.json({ error: 'Ação inválida. Use ?action=confirm ou ?action=reconcile' }, { status: 400 })
    } catch (error: any) {
      console.error('[PATCH /api/transactions/[id]]', error)
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message || 'Erro ao processar ação' }, { status: 500 })
    }
  })
}
