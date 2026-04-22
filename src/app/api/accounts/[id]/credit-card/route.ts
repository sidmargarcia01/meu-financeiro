/**
 * CAMADA: Routes
 * MÓDULO: Accounts
 * RESPONSABILIDADE: Endpoint para adicionar cartão de crédito à conta
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { AccountService } from '@/services/accountService'
import { createCreditCardSchema } from '@/models/account'

const accountService = new AccountService()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, createCreditCardSchema, async (req, data) => {
      try {
        const { id } = await params
        // Verificar se a conta pertence ao usuário
        const account = await accountService.findById(user.id, id)
        if (!account) {
          return NextResponse.json(
            { error: 'Conta não encontrada' },
            { status: 404 }
          )
        }

        // Verificar se já tem cartão para esta conta
        const existingCard = await accountService.findCreditCardByAccountId(id)
        if (existingCard) {
          return NextResponse.json(
            { error: 'Esta conta já possui um cartão de crédito' },
            { status: 400 }
          )
        }

        const creditCard = await accountService.createCreditCard({
          ...data,
          accountId: id,
        })

        return NextResponse.json(creditCard, { status: 201 })
      } catch (error) {
        console.error('Erro ao criar cartão de crédito:', error)

        if (error instanceof Error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { error: 'Erro ao criar cartão de crédito' },
          { status: 500 }
        )
      }
    })
  })
}
