/**
 * CAMADA: Repository
 * MÓDULO: Account
 * RESPONSABILIDADE: Acesso ao banco de dados para contas
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase, Account models
 */

import { supabase } from '@/lib/supabase'
import {
  Account,
  AccountWithBalance,
  CreditCard,
  AccountWithCreditCard
} from '@/models/account'

export class AccountRepository {
  // Criar conta
  async create(data: {
    userId: string
    name: string
    type: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
    initialBalance?: number
    initialBalanceDate?: string | null
    currency?: string
    icon?: string
    bankConnectionId?: string
  }): Promise<Account> {
    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        user_id: data.userId,
        name: data.name,
        type: data.type,
        initial_balance: data.initialBalance || 0,
        initial_balance_date: data.initialBalanceDate || null,
        currency: data.currency || 'BRL',
        icon: data.icon,
        bank_connection_id: data.bankConnectionId,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }
  }

  // Buscar conta por ID
  async findById(id: string, userId: string): Promise<Account | null> {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !account) return null

    return {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }
  }

  // Buscar conta com cartão de crédito
  async findByIdWithCreditCard(id: string, userId: string): Promise<AccountWithCreditCard | null> {
    const { data: account, error } = await supabase
      .from('accounts')
      .select(`
        *,
        credit_cards(*)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error || !account) return null

    const creditCard = (account.credit_cards as any[])?.[0] || null

    return {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at),
      creditCard: creditCard ? {
        id: creditCard.id,
        accountId: creditCard.account_id,
        creditLimit: creditCard.credit_limit ? Number(creditCard.credit_limit) : undefined,
        closingDay: creditCard.closing_day,
        dueDay: creditCard.due_day,
        createdAt: new Date(creditCard.created_at)
      } : undefined
    }
  }

  // Listar contas do usuário
  async list(userId: string, activeOnly: boolean = true): Promise<Account[]> {
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: accounts, error } = await query

    if (error) throw error

    return (accounts || []).map(account => ({
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }))
  }

  // Listar contas com saldos
  async listWithBalances(userId: string): Promise<AccountWithBalance[]> {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        *,
        transactions (
          amount,
          status,
          type
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error

    // Calcular saldos — fórmula robusta: usa type para determinar sinal,
    // ignorando o sinal armazenado no DB (corrige inconsistências históricas)
    return (accounts || []).map((account: any) => {
      const transactions = account.transactions || []
      const initialBalance = Number(account.initial_balance) || 0

      // Impacto de uma transação no saldo (RECEITA=+, qualquer outra=-),
      // sempre usa valor absoluto para neutralizar inconsistências no DB
      const impact = (t: any): number => {
        const abs = Math.abs(Number(t.amount) || 0)
        return t.type === 'RECEITA' ? abs : -abs
      }

      // Projetado = saldo inicial + TODAS as transações (pendentes, confirmadas, conciliadas)
      const projectedBalance = transactions.reduce(
        (sum: number, t: any) => sum + impact(t),
        initialBalance
      )

      // Confirmado = saldo inicial + somente CONCILIADO
      // (reflete o saldo real reconciliado com o extrato bancário)
      const confirmedBalance = transactions
        .filter((t: any) => t.status === 'CONCILIADO')
        .reduce((sum: number, t: any) => sum + impact(t), initialBalance)

      return {
        id: account.id,
        userId: account.user_id,
        name: account.name,
        type: account.type,
        initialBalance: initialBalance,
        currency: account.currency,
        icon: account.icon,
        isActive: account.is_active,
        bankConnectionId: account.bank_connection_id,
        currentBalance: projectedBalance,
        projectedBalance,
        confirmedBalance,
        createdAt: new Date(account.created_at)
      }
    })
  }

  // Atualizar conta
  async update(
    id: string,
    userId: string,
    data: Partial<{
      name?: string
      type?: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
      initialBalance?: number
      initialBalanceDate?: string | null
      currency?: string
      icon?: string
      isActive?: boolean
      bankConnectionId?: string
    }>
  ): Promise<Account> {
    const updatePayload: Record<string, any> = {
      name: data.name,
      type: data.type,
      currency: data.currency,
      icon: data.icon,
      is_active: data.isActive,
      bank_connection_id: data.bankConnectionId,
    }
    if (data.initialBalance !== undefined) {
      updatePayload.initial_balance = data.initialBalance
    }
    if (data.initialBalanceDate !== undefined) {
      updatePayload.initial_balance_date = data.initialBalanceDate || null
    }
    const { data: account, error } = await supabase
      .from('accounts')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return {
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }
  }

  // Excluir conta
  async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Criar cartão de crédito
  async createCreditCard(data: {
    accountId: string
    creditLimit?: number
    closingDay: number
    dueDay: number
  }): Promise<CreditCard> {
    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .insert({
        account_id: data.accountId,
        credit_limit: data.creditLimit,
        closing_day: data.closingDay,
        due_day: data.dueDay
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: creditCard.id,
      accountId: creditCard.account_id,
      creditLimit: creditCard.credit_limit ? Number(creditCard.credit_limit) : undefined,
      closingDay: creditCard.closing_day,
      dueDay: creditCard.due_day,
      createdAt: new Date(creditCard.created_at)
    }
  }

  // Buscar cartão de crédito por ID
  async findCreditCardById(id: string): Promise<CreditCard | null> {
    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !creditCard) return null

    return {
      id: creditCard.id,
      accountId: creditCard.account_id,
      creditLimit: creditCard.credit_limit ? Number(creditCard.credit_limit) : undefined,
      closingDay: creditCard.closing_day,
      dueDay: creditCard.due_day,
      createdAt: new Date(creditCard.created_at)
    }
  }

  // Atualizar cartão de crédito
  async updateCreditCard(
    id: string,
    data: Partial<{
      creditLimit?: number
      closingDay?: number
      dueDay?: number
    }>
  ): Promise<CreditCard> {
    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .update({
        credit_limit: data.creditLimit,
        closing_day: data.closingDay,
        due_day: data.dueDay
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return {
      id: creditCard.id,
      accountId: creditCard.account_id,
      creditLimit: creditCard.credit_limit ? Number(creditCard.credit_limit) : undefined,
      closingDay: creditCard.closing_day,
      dueDay: creditCard.due_day,
      createdAt: new Date(creditCard.created_at)
    }
  }

  // Excluir cartão de crédito
  async deleteCreditCard(id: string): Promise<void> {
    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Buscar cartão de crédito por ID da conta
  async findCreditCardByAccountId(accountId: string): Promise<CreditCard | null> {
    const { data: creditCard, error } = await supabase
      .from('credit_cards')
      .select('*')
      .eq('account_id', accountId)
      .single()

    if (error || !creditCard) return null

    return {
      id: creditCard.id,
      accountId: creditCard.account_id,
      creditLimit: creditCard.credit_limit ? Number(creditCard.credit_limit) : undefined,
      closingDay: creditCard.closing_day,
      dueDay: creditCard.due_day,
      createdAt: new Date(creditCard.created_at)
    }
  }

  // Verificar se conta existe
  async exists(id: string, userId: string): Promise<boolean> {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    return !error && !!account
  }

  // Buscar contas por tipo
  async findByType(
    userId: string,
    type: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
  ): Promise<Account[]> {
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error

    return (accounts || []).map((account: any) => ({
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }))
  }

  // Contar contas do usuário
  async count(userId: string, activeOnly: boolean = true): Promise<number> {
    let query = supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { count, error } = await query

    if (error) throw error

    return count || 0
  }

  // Verificar se conta possui transações
  async hasTransactions(accountId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', accountId)

    if (error) throw error

    return (count || 0) > 0
  }

  // Buscar todas as contas de um usuário
  async findAllByUser(userId: string, includeArchived = false): Promise<Account[]> {
    let query = supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true })

    if (!includeArchived) {
      query = query.eq('is_active', true)
    }

    const { data: accounts, error } = await query

    if (error) throw error

    return (accounts || []).map((account: any) => ({
      id: account.id,
      userId: account.user_id,
      name: account.name,
      type: account.type,
      initialBalance: Number(account.initial_balance),
      initialBalanceDate: account.initial_balance_date ? new Date(account.initial_balance_date) : undefined,
      currency: account.currency,
      icon: account.icon,
      isActive: account.is_active,
      bankConnectionId: account.bank_connection_id,
      createdAt: new Date(account.created_at)
    }))
  }

  /**
   * MÉTODO: sumInitialBalancesBefore
   * RESPONSABILIDADE: Somar saldos iniciais de contas ativas cuja data do saldo é anterior à data informada
   * NÃO DEVE: Conter lógica de negócio — apenas soma bruta
   */
  async sumInitialBalancesBefore(userId: string, date: string): Promise<number> {
    const { data, error } = await supabase
      .from('accounts')
      .select('initial_balance, initial_balance_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .not('initial_balance_date', 'is', null)
      .lt('initial_balance_date', date)

    if (error) throw error

    return (data || []).reduce((sum, a) => sum + Number(a.initial_balance || 0), 0)
  }
}

export const accountRepository = new AccountRepository()
