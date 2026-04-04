/**
 * CAMADA: Routes
 * MÓDULO: Accounts
 * RESPONSABILIDADE: Endpoint para obter conta específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { AccountService } from '@/services/accountService'

const accountService = new AccountService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const account = await accountService.findById(user.id, params.id)
      
      if (!account) {
        return NextResponse.json(
          { error: 'Conta não encontrada' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(account)
    } catch (error) {
      console.error('Erro ao obter conta:', error)
      return NextResponse.json(
        { error: 'Erro ao obter conta' },
        { status: 500 }
      )
    }
  })
}
