/**
 * CAMADA: Routes
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Endpoints para gestão de transações financeiras
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, TransactionService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { TransactionService } from '@/services/transactionService'
import { createTransactionInputSchema, updateTransactionSchema, transactionFiltersSchema } from '@/models/transaction'

const transactionService = new TransactionService()

// GET /api/transactions - Listar transações
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)

      // Parse filtros
      const filters = {
        accountId: searchParams.get('accountId') || undefined,
        categoryId: searchParams.get('categoryId') || undefined,
        type: searchParams.get('type') as any || undefined,
        status: searchParams.get('status') as any || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        search: searchParams.get('search') || undefined,
        tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      }

      // Parse paginação
      const page = parseInt(searchParams.get('page') || '1')
      const limit = parseInt(searchParams.get('limit') || '20')

      const result = await transactionService.listTransactions(
        user.id,
        filters,
        { page, limit }
      )

      return NextResponse.json(result)
    } catch (error) {
      console.error('Erro ao listar transações:', error)
      return NextResponse.json(
        { error: 'Erro ao listar transações' },
        { status: 500 }
      )
    }
  })
}

// POST /api/transactions - Criar transação
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, createTransactionInputSchema, async (req, data) => {
      try {
        const transaction = await transactionService.createTransaction(user.id, {
          ...data,
          status: data.status || 'PENDENTE',
          regime: data.regime || 'CAIXA',
          isRecurring: data.isRecurring || false,
          tags: data.tags || []
        })
        return NextResponse.json(transaction, { status: 201 })
      } catch (error: any) {
        const msg = error?.message || error?.details || 'Erro ao criar transação'
        console.error('[POST /api/transactions]', error)
        return NextResponse.json({ error: msg }, { status: 400 })
      }
    })
  })
}

// DELETE /api/transactions?recurrenceId=xxx | ?baseDescription=xxx&accountId=yyy - Excluir série
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const recurrenceId = searchParams.get('recurrenceId')
      const baseDescription = searchParams.get('baseDescription')
      const accountId = searchParams.get('accountId')

      if (recurrenceId) {
        await transactionService.deleteTransactionsByRecurrenceId(user.id, recurrenceId)
        return NextResponse.json({ success: true })
      }

      if (baseDescription && accountId) {
        await transactionService.deleteTransactionsByDescription(user.id, accountId, baseDescription)
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ error: 'Informe recurrenceId ou baseDescription+accountId' }, { status: 400 })
    } catch (error: any) {
      console.error('[DELETE /api/transactions]', error)
      return NextResponse.json({ error: error.message || 'Erro ao excluir série' }, { status: 500 })
    }
  })
}

// GET /api/transactions/[id] - Obter transação específica
// MOVIDO para: src/app/api/transactions/[id]/route.ts

// PUT /api/transactions/[id] - Atualizar transação
// MOVIDO para: src/app/api/transactions/[id]/route.ts

// DELETE /api/transactions/[id] - Excluir transação
// MOVIDO para: src/app/api/transactions/[id]/route.ts

// GET /api/transactions/balances - Obter saldos por conta
// MOVIDO para: src/app/api/transactions/balances/route.ts

// GET /api/transactions/summary - Obter resumo mensal
// MOVIDO para: src/app/api/transactions/summary/route.ts
