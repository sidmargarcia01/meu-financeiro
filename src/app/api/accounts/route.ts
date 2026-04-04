/**
 * CAMADA: Routes
 * MÓDULO: Accounts
 * RESPONSABILIDADE: Endpoints para gestão de contas bancárias
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { AccountService } from '@/services/accountService'
import { createAccountSchema, updateAccountSchema, createCreditCardSchema } from '@/models/account'

const accountService = new AccountService()

// GET /api/accounts - Listar contas do usuário
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const withBalances = searchParams.get('balances') === 'true'
      
      if (withBalances) {
        const accounts = await accountService.listWithBalances(user.id)
        return NextResponse.json(accounts)
      } else {
        const accounts = await accountService.list(user.id)
        return NextResponse.json(accounts)
      }
    } catch (error) {
      console.error('Erro ao listar contas:', error)
      return NextResponse.json(
        { error: 'Erro ao listar contas' },
        { status: 500 }
      )
    }
  })
}

// POST /api/accounts - Criar conta
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, createAccountSchema, async (req, data) => {
      try {
        const account = await accountService.create(user.id, {
          ...data,
          initialBalance: data.initialBalance || 0,
          currency: data.currency || 'BRL'
        })
        return NextResponse.json(account, { status: 201 })
      } catch (error) {
        console.error('Erro ao criar conta:', error)
        
        if (error instanceof Error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: 'Erro ao criar conta' },
          { status: 500 }
        )
      }
    })
  })
}

// GET /api/accounts/[id] - Obter conta específica
// MOVIDO para: src/app/api/accounts/[id]/route.ts

// PUT /api/accounts/[id] - Atualizar conta
// MOVIDO para: src/app/api/accounts/[id]/route.ts

// DELETE /api/accounts/[id] - Excluir conta
// MOVIDO para: src/app/api/accounts/[id]/route.ts

// POST /api/accounts/[id]/credit-card - Adicionar cartão de crédito
// MOVIDO para: src/app/api/accounts/[id]/credit-card/route.ts

// GET /api/accounts/[id]/credit-card - Obter cartão de crédito
// MOVIDO para: src/app/api/accounts/[id]/credit-card/route.ts

// PUT /api/accounts/credit-cards/[id] - Atualizar cartão de crédito
// MOVIDO para: src/app/api/accounts/credit-cards/[id]/route.ts

// DELETE /api/accounts/credit-cards/[id] - Excluir cartão de crédito
// MOVIDO para: src/app/api/accounts/credit-cards/[id]/route.ts
