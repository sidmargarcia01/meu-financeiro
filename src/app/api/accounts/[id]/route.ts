/**
 * CAMADA: Routes
 * MÓDULO: Accounts
 * RESPONSABILIDADE: Endpoints GET | PUT | DELETE para conta específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { AccountService } from '@/services/accountService'
import { updateAccountSchema } from '@/models/account'

const accountService = new AccountService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const account = await accountService.findById(user.id, params.id)
      if (!account) {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
      }
      return NextResponse.json(account)
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao obter conta' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, updateAccountSchema, async (req, data) => {
      try {
        const account = await accountService.update(user.id, params.id, data)
        return NextResponse.json(account)
      } catch (error: any) {
        if (error.message === 'Conta não encontrada') {
          return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
        }
        return NextResponse.json({ error: 'Erro ao atualizar conta' }, { status: 500 })
      }
    })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      await accountService.delete(user.id, params.id)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message === 'Conta não encontrada') {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
      }
      if (error.message?.includes('lançamentos')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      return NextResponse.json({ error: 'Erro ao excluir conta' }, { status: 500 })
    }
  })
}
