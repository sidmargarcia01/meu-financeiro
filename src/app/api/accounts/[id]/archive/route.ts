/**
 * CAMADA: Routes
 * MÓDULO: Accounts
 * RESPONSABILIDADE: PATCH /api/accounts/[id]/archive — arquivar/desarquivar conta
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { AccountService } from '@/services/accountService'

const accountService = new AccountService()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json().catch(() => ({}))
      const isActive = body.isActive === false ? false : true

      const account = await accountService.update(user.id, params.id, { isActive })
      return NextResponse.json(account)
    } catch (error: any) {
      if (error.message === 'Conta não encontrada') {
        return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro ao arquivar conta' }, { status: 500 })
    }
  })
}
