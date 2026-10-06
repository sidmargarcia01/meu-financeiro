import { queryAll } from '@/lib/queryAll'
import { signedAmount } from '@/lib/financial'
/**
 * CAMADA: Repository
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Acesso ao banco de dados para transações
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase, Transaction models
 */

import { supabase } from '@/lib/requestSupabase'
import {
  Transaction,
  TransactionWithRelations,
  AccountBalance,
  MonthlySummary,
  TransactionFilters
} from '@/models/transaction'

export class TransactionRepository {
  // Criar transação
  async create(data: {
    userId: string
    accountId?: string
    categoryId?: string | null
    transferGroupId?: string
    recurrenceId?: string
    centerId?: string | null
    projectId?: string | null
    contactId?: string | null
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    dueDate: Date
    paymentDate?: Date
    competenceDate?: Date
    regime?: 'CAIXA' | 'COMPETENCIA'
    isRecurring?: boolean
    tags?: string[]
    attachmentUrl?: string
    notes?: string | null
  }): Promise<Transaction> {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert({
        user_id: data.userId,
        account_id: data.accountId,
        category_id: data.categoryId,
        recurrence_id: data.recurrenceId,
        center_id: data.centerId,
        project_id: data.projectId,
        contact_id: data.contactId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        status: data.status || 'PENDENTE',
        due_date: data.dueDate.toISOString().split('T')[0],
        payment_date: data.paymentDate?.toISOString().split('T')[0],
        competence_date: data.competenceDate?.toISOString().split('T')[0],
        regime: data.regime || 'CAIXA',
        is_recurring: data.isRecurring || false,
        attachment_url: data.attachmentUrl,
        notes: data.notes,
        tags: data.tags ?? [],
      })
      .select()
      .single()

    if (error) throw error

    return {
      id: transaction.id,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      recurrenceId: transaction.recurrence_id,
      transferGroupId: transaction.transfer_group_id,
      centerId: transaction.center_id,
      projectId: transaction.project_id,
      contactId: transaction.contact_id,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      dueDate: transaction.due_date,
      paymentDate: transaction.payment_date,
      competenceDate: transaction.competence_date,
      regime: transaction.regime,
      isRecurring: transaction.is_recurring,
      attachmentUrl: transaction.attachment_url,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    } as Transaction
  }

  // Criar múltiplas transações
  async createMany(transactions: {
    userId: string
    accountId?: string
    categoryId?: string | null
    transferGroupId?: string
    recurrenceId?: string
    centerId?: string | null
    projectId?: string | null
    contactId?: string | null
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    dueDate: Date
    paymentDate?: Date
    competenceDate?: Date
    regime?: 'CAIXA' | 'COMPETENCIA'
    isRecurring?: boolean
    tags?: string[]
    attachmentUrl?: string
    notes?: string | null
  }[]): Promise<Transaction[]> {
    const transactionsToInsert = transactions.map(t => ({
      user_id: t.userId,
      account_id: t.accountId,
      category_id: t.categoryId,
      recurrence_id: t.recurrenceId,
      transfer_group_id: t.transferGroupId,
      center_id: t.centerId,
      project_id: t.projectId,
      contact_id: t.contactId,
      description: t.description,
      amount: t.amount,
      type: t.type,
      status: t.status || 'PENDENTE',
      due_date: t.dueDate.toISOString().split('T')[0],
      payment_date: t.paymentDate?.toISOString().split('T')[0],
      competence_date: t.competenceDate?.toISOString().split('T')[0],
      regime: t.regime || 'CAIXA',
      is_recurring: t.isRecurring || false,
      attachment_url: t.attachmentUrl,
      notes: t.notes,
      tags: t.tags ?? [],
    }))

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select()

    if (error) throw error

    return (data || []).map((transaction: any) => ({
      id: transaction.id,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      recurrenceId: transaction.recurrence_id,
      transferGroupId: transaction.transfer_group_id,
      centerId: transaction.center_id,
      projectId: transaction.project_id,
      contactId: transaction.contact_id,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      dueDate: transaction.due_date,
      paymentDate: transaction.payment_date,
      competenceDate: transaction.competence_date,
      regime: transaction.regime,
      isRecurring: transaction.is_recurring,
      attachmentUrl: transaction.attachment_url,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
    } as Transaction))
  }

  // Verificar se transação existe
  async exists(id: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  }

  // Listar transações com filtros
  async list(userId: string, filters?: {
    startDate?: string
    endDate?: string
    accountId?: string
    categoryId?: string | null
    type?: string
    status?: string
    statuses?: string[]
    search?: string
    dateField?: 'due_date' | 'competence_date' | 'payment_date' | 'effective_cash_date' | 'effective_competence_date'
    limit?: number
    page?: number
  }): Promise<any[]> {
    const dateField = filters?.dateField === 'payment_date' ? 'effective_cash_date' : filters?.dateField === 'competence_date' ? 'effective_competence_date' : filters?.dateField || 'due_date'

    // Buscar transações
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order(dateField, { ascending: false })

    if (filters?.startDate) {
      query = query.gte(dateField, filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte(dateField, filters.endDate)
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId)
    }
    if (filters?.categoryId) {
      const { data: children, error: childError } = await supabase.from('categories').select('id').eq('user_id', userId).eq('parent_id', filters.categoryId)
      if (childError) throw childError
      query = query.in('category_id', [filters.categoryId, ...(children || []).map(c => c.id)])
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses)
    }
    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }
    if (filters?.limit) {
      const offset = ((filters.page ?? 1) - 1) * filters.limit
      query = query.range(offset, offset + filters.limit - 1)
    }

    const { data: transactions, error } = filters?.limit ? await query : await queryAll(query)
    if (error) throw error

    if (!transactions || transactions.length === 0) return []

    // Buscar contas e categorias separadamente para evitar join problemático
    const accountIds = [...new Set(transactions.map((t: any) => t.account_id).filter(Boolean))]
    const categoryIds = [...new Set(transactions.map((t: any) => t.category_id).filter(Boolean))]

    // Usar supabase normal (com RLS) para respeitar as políticas do usuário
    const [accountsRes, categoriesRes] = await Promise.all([
      accountIds.length > 0
        ? supabase.from('accounts').select('id, name').in('id', accountIds)
        : Promise.resolve({ data: [] }),
      categoryIds.length > 0
        ? supabase.from('categories').select('id, name, dre_group, parent_id').eq('user_id', userId)
        : Promise.resolve({ data: [] }),
    ])

    const accountsMap = new Map((accountsRes.data || []).map((a: any) => [a.id, a.name]))
    const categoriesMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]))
    const categoryRows = categoriesRes.data || []
    const categoryById = new Map(categoryRows.map((c: any) => [c.id, c]))
    const dreGroupMap = new Map(categoryRows.map((c: any) => [c.id, (categoryById.get(c.parent_id) as any)?.dre_group ?? c.dre_group]))

    return transactions.map((t: any) => ({
      ...t,
      recurrence_id: t.recurrence_id ?? null,
      account_name: accountsMap.get(t.account_id) ?? null,
      category_name: categoriesMap.get(t.category_id) ?? null,
      category_id: t.category_id ?? null,
      dre_group: dreGroupMap.get(t.category_id) ?? null,
    }))
  }

  // Buscar saldos por conta
  async getBalancesByAccount(userId: string): Promise<AccountBalance[]> {
    const { accountRepository } = await import('@/repositories/accountRepository')
    const accounts = await accountRepository.listWithBalances(userId)
    return accounts.map(a => ({ accountId: a.id, accountName: a.name,
      projectedBalance: a.projectedBalance, confirmedBalance: a.confirmedBalance }))
  }

  async deleteTransfer(groupId: string, userId: string) {
    const { error } = await supabase.from('transactions').delete().eq('user_id', userId).eq('transfer_group_id', groupId)
    if (error) throw error
  }

  async reconcileTransfer(groupId: string, userId: string, paymentDate: string) {
    const { data, error } = await supabase.from('transactions')
      .update({ status: 'CONCILIADO', payment_date: paymentDate, updated_at: new Date().toISOString() })
      .eq('user_id', userId).eq('transfer_group_id', groupId).select()
    if (error) throw error
    return data?.[0]
  }

  // Atualizar transação
  async update(id: string, userId: string, data: Partial<{
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    dueDate: string
    paymentDate?: string
    competenceDate?: string | null
    regime?: 'CAIXA' | 'COMPETENCIA'
    accountId?: string
    categoryId?: string | null
    centerId?: string | null
    projectId?: string | null
    contactId?: string | null
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    tags?: string[]
    attachmentUrl?: string
    notes?: string | null
  }>) {
    const { data: transaction, error } = await supabase
      .from('transactions')
      .update({
        description: data.description,
        amount: data.amount,
        type: data.type,
        due_date: data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : undefined,
        payment_date: data.paymentDate,
        competence_date: data.competenceDate,
        regime: data.regime,
        account_id: data.accountId,
        category_id: data.categoryId,
        center_id: data.centerId,
        project_id: data.projectId,
        contact_id: data.contactId,
        status: data.status,
        attachment_url: data.attachmentUrl,
        notes: data.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return transaction
  }

  // Excluir transação
  async delete(id: string, userId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Excluir todas as transações de uma recorrência (a partir de uma data opcional)
  async deleteByRecurrenceId(recurrenceId: string, userId: string, fromDate?: string) {
    let query = supabase
      .from('transactions')
      .delete()
      .eq('recurrence_id', recurrenceId)
      .eq('user_id', userId)

    if (fromDate) {
      query = query.gte('due_date', fromDate)
    }

    const { error } = await query
    if (error) throw error
  }

  // Excluir transações por descrição base (fallback para parcelas sem recurrence_id)
  async deleteByDescriptionPattern(userId: string, accountId: string, baseDescription: string, fromDate?: string) {
    let query = supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .ilike('description', `${baseDescription} - Parcela %/%`)

    if (fromDate) {
      query = query.gte('due_date', fromDate)
    }

    const { error } = await query
    if (error) throw error
  }

  // Buscar transação por ID
  async findById(id: string, userId: string): Promise<TransactionWithRelations | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(id,name,type),
        category:categories(id,name,type),
        center:cost_centers(id,name,type),
        project:projects(id,name,status),
        contact:contacts(id,name,type)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      accountId: data.account_id,
      categoryId: data.category_id,
      recurrenceId: data.recurrence_id,
      transferGroupId: data.transfer_group_id,
      centerId: data.center_id,
      projectId: data.project_id,
      contactId: data.contact_id,
      description: data.description,
      amount: Number(data.amount),
      type: data.type,
      status: data.status,
      dueDate: data.due_date,
      paymentDate: data.payment_date,
      competenceDate: data.competence_date,
      regime: data.regime,
      isRecurring: data.is_recurring,
      attachmentUrl: data.attachment_url,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      account: data.account ? {
        id: data.account.id,
        name: data.account.name,
        type: data.account.type as 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
      } : undefined,
      category: data.category ? {
        id: data.category.id,
        name: data.category.name,
        type: data.category.type as 'RECEITA' | 'DESPESA'
      } : undefined,
      center: data.center ? {
        id: data.center.id,
        name: data.center.name,
        type: data.center.type
      } : undefined,
      project: data.project ? {
        id: data.project.id,
        name: data.project.name,
        status: data.project.status
      } : undefined,
      contact: data.contact ? {
        id: data.contact.id,
        name: data.contact.name,
        type: data.contact.type
      } : undefined,
    } as TransactionWithRelations
  }

  // Somar valores por conta e status
  // eslint-disable-next-line prefer-const
  async sumByAccount(accountId: string, statusFilter?: string[], openingDate?: string): Promise<number> {
    let query = supabase
      .from('transactions')
      .select('amount, type, status, due_date, payment_date')
      .eq('account_id', accountId)

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data, error } = await queryAll(query)

    if (error) throw error

    if (!data || data.length === 0) return 0

    return data.filter(t => !openingDate || (t.status === 'PENDENTE' ? t.due_date : t.payment_date || t.due_date) >= openingDate).reduce((sum, transaction) => {
      // Soma direta: receitas são positivas, despesas são negativas no banco
      return sum + signedAmount(transaction.type, transaction.amount)
    }, 0)
  }

  // Contar transações do usuário no mês
  async countByUserMonth(userId: string, month: number, year: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const { count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])

    if (error) throw error

    return count || 0
  }

  /**
   * MÉTODO: findUpcoming
   * RESPONSABILIDADE: Buscar lançamentos próximos ao vencimento ou vencidos
   * NÃO DEVE: Conter lógica de classificação (vencido vs próximo) — isso é do service
   */
  async findUpcoming(
    userId: string,
    filters: { status: string; dateFrom: string; dateTo: string }
  ): Promise<Transaction[]> {
    const query = supabase
      .from('transactions')
      .select(`
        *,
        account:accounts(id,name,type),
        category:categories(id,name,type),
        center:cost_centers(id,name,type),
        project:projects(id,name,status),
        contact:contacts(id,name,type)
      `)
      .eq('user_id', userId)
      .eq('status', filters.status)
      .gte('due_date', filters.dateFrom)
      .lte('due_date', filters.dateTo)
      .order('due_date', { ascending: true })

    const { data, error } = await query

    if (error) throw error

    return (data || []).map((transaction: any) => ({
      id: transaction.id,
      userId: transaction.user_id,
      accountId: transaction.account_id,
      categoryId: transaction.category_id,
      recurrenceId: transaction.recurrence_id,
      transferGroupId: transaction.transfer_group_id,
      centerId: transaction.center_id,
      projectId: transaction.project_id,
      contactId: transaction.contact_id,
      description: transaction.description,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      dueDate: transaction.due_date,
      paymentDate: transaction.payment_date,
      competenceDate: transaction.competence_date,
      regime: transaction.regime,
      isRecurring: transaction.is_recurring,
      attachmentUrl: transaction.attachment_url,
      notes: transaction.notes,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at,
      account: transaction.account ? {
        id: transaction.account.id,
        name: transaction.account.name,
        type: transaction.account.type as 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
      } : undefined,
      category: transaction.category ? {
        id: transaction.category.id,
        name: transaction.category.name,
        type: transaction.category.type as 'RECEITA' | 'DESPESA'
      } : undefined,
      center: transaction.center ? {
        id: transaction.center.id,
        name: transaction.center.name,
        type: transaction.center.type
      } : undefined,
      project: transaction.project ? {
        id: transaction.project.id,
        name: transaction.project.name,
        status: transaction.project.status
      } : undefined,
      contact: transaction.contact ? {
        id: transaction.contact.id,
        name: transaction.contact.name,
        type: transaction.contact.type
      } : undefined,
    } as Transaction))
  }

  /**
   * MÉTODO: search
   * RESPONSABILIDADE: Buscar transações por descrição (busca global)
   * NÃO DEVE: Conter lógica de ranking — isso é do service
   */
  async search(
    userId: string,
    filters: { term: string; limit: number }
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status, due_date,
        category:categories(id,name)
      `)
      .eq('user_id', userId)
      .ilike('description', `%${filters.term}%`)
      .order('due_date', { ascending: false })
      .limit(filters.limit)

    if (error) throw error

    return (data || []).map((t: any) => ({
      id: t.id,
      userId,
      description: t.description,
      amount: Number(t.amount),
      type: t.type,
      status: t.status,
      dueDate: t.due_date,
      regime: 'CAIXA' as const,
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: t.category ? { id: t.category.id, name: t.category.name, type: t.category.type } : undefined,
    } as Transaction))
  }

  /**
   * MÉTODO: sumByCategory
   * RESPONSABILIDADE: Somar lançamentos agrupados por categoria
   * NÃO DEVE: Calcular percentuais — isso é do service
   */
  async sumByCategory(
    userId: string,
    filters: { type: 'RECEITA' | 'DESPESA'; mes: number; ano: number }
  ): Promise<Array<{ category_id: string; category_name: string; total: number }>> {
    const startDate = new Date(filters.ano, filters.mes - 1, 1)
    const endDate = new Date(filters.ano, filters.mes, 0)

    const { data, error } = await queryAll(supabase
      .from('transactions')
      .select(`
        categories!inner(id, name),
        amount
      `)
      .eq('user_id', userId)
      .eq('type', filters.type)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])
      .not('category_id', 'is', null))

    if (error) throw error

    // Agrupar por categoria e somar valores
    const categoryMap = new Map<string, { category_id: string; category_name: string; total: number }>()

      ; (data || []).forEach((item: any) => {
        const categoryId = item.categories.id
        const categoryName = item.categories.name
        // Usar Math.abs para garantir que despesas (negativas no DB) sejam somadas corretamente
        const amount = Math.abs(Number(item.amount))

        if (categoryMap.has(categoryId)) {
          const existing = categoryMap.get(categoryId)!
          existing.total += amount
        } else {
          categoryMap.set(categoryId, {
            category_id: categoryId,
            category_name: categoryName,
            total: amount
          })
        }
      })

    return Array.from(categoryMap.values())
  }

  // Sobrecarga do método getMonthlySummary para aceitar mês e ano específicos
  async getMonthlySummary(userId: string, month: number, year: number): Promise<{
    receitas: number
    despesas: number
    mes: number
    ano: number
  }> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const { data, error } = await queryAll(supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0]))

    if (error) throw error

    const receitas = (data || [])
      .filter(t => t.type === 'RECEITA')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const despesas = (data || [])
      .filter(t => t.type === 'DESPESA')
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0)

    return {
      receitas,
      despesas,
      mes: month,
      ano: year
    }
  }

  /**
   * MÉTODO: findAllForPeriodWithCategory
   * RESPONSABILIDADE: Buscar transações de um período com dados da categoria
   * NÃO DEVE: Calcular saldos ou agrupar — isso é do service
   */
  async findAllForPeriodWithCategory(
    userId: string,
    inicio: string,
    fim: string,
    statusFilter: string[],
    dateField: 'due_date' | 'competence_date' | 'payment_date' | 'effective_cash_date' | 'effective_competence_date' = 'due_date'
  ): Promise<any[]> {
    const { data, error } = await queryAll(supabase
      .from('transactions')
      .select(`
        id, description, amount, type, status,
        due_date, competence_date, payment_date, effective_cash_date, effective_competence_date,
        categories(id, name, type, parent_id, dre_group)
      `)
      .eq('user_id', userId)
      .in('type', ['RECEITA', 'DESPESA'])
      .in('status', statusFilter)
      .gte(dateField, inicio)
      .lte(dateField, fim)
      .order(dateField))

    if (error) throw error
    return data || []
  }

  /**
   * MÉTODO: sumConfirmedBefore
   * RESPONSABILIDADE: Somar saldo de transações confirmadas antes de uma data
   * NÃO DEVE: Filtrar por conta ou categoria — mantém total do usuário
   */
  async sumConfirmedBefore(userId: string, date: string): Promise<number> {
    const [{data: rows,error},{data: accounts,error: accountError}] = await Promise.all([
      queryAll(supabase.from('transactions').select('account_id,amount,type,effective_cash_date').eq('user_id',userId).in('status',['CONFIRMADO','CONCILIADO']).lt('effective_cash_date',date)),
      queryAll(supabase.from('accounts').select('id,initial_balance_date').eq('user_id',userId)),
    ])
    if (error || accountError) throw error || accountError
    const bases = new Map(accounts.map(a => [a.id,a.initial_balance_date]))
    return rows.filter(t => !bases.get(t.account_id) || t.effective_cash_date >= bases.get(t.account_id))
      .reduce((sum,t) => sum + signedAmount(t.type,t.amount),0)
  }
}

export const transactionRepository = new TransactionRepository()
