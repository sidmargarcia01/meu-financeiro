/**
 * CAMADA: Routes
 * MÓDULO: Accounts Balance
 * RESPONSABILIDADE: Endpoint para obter saldo anterior até data D-1
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, AccountService
 * 
 * FASE 3 - Endpoint robusto para Saldo Anterior
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { AccountService } from '@/services/accountService'

const accountService = new AccountService()

// GET /api/accounts/balance?date=YYYY-MM-DD&accounts=id1,id2,id3
// Retorna saldo acumulado até D-1 (incluindo initialBalance + transações CONFIRMADO/CONCILIADO)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      
      // Parse e validação dos parâmetros
      const date = searchParams.get('date')
      const accountsParam = searchParams.get('accounts')
      
      // Validação: date é obrigatório
      if (!date) {
        return NextResponse.json(
          { error: 'Parâmetro "date" é obrigatório (formato: yyyy-mm-dd)' },
          { status: 400 }
        )
      }
      
      // Validação: formato da data
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          { error: 'Parâmetro "date" deve estar no formato yyyy-mm-dd' },
          { status: 400 }
        )
      }
      
      // Validação: accounts é obrigatório
      if (!accountsParam || accountsParam.trim() === '') {
        return NextResponse.json(
          { error: 'Parâmetro "accounts" é obrigatório (lista de IDs separados por vírgula)' },
          { status: 400 }
        )
      }
      
      // Parse da lista de contas
      const accountIds = accountsParam.split(',').filter(id => id.trim() !== '')
      
      if (accountIds.length === 0) {
        return NextResponse.json(
          { error: 'Pelo menos uma conta deve ser informada' },
          { status: 400 }
        )
      }
      
      // Chamar service para calcular saldos
      const result = await accountService.getBalancesUntilDate(
        user.id,
        accountIds,
        date
      )
      
      return NextResponse.json(result)
      
    } catch (error) {
      console.error('Erro ao calcular saldos:', error)
      
      // Erros de validação do service retornam 400
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()
        if (
          errorMessage.includes('formato') ||
          errorMessage.includes('conta') ||
          errorMessage.includes('data')
        ) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
      }
      
      // Erros internos retornam 500 com mensagem genérica (segurança)
      return NextResponse.json(
        { error: 'Erro interno ao calcular saldos' },
        { status: 500 }
      )
    }
  })
}
