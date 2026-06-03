/**
 * CAMADA: Repository
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Acesso ao banco de dados para transações
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Supabase, Transaction models
 */

import { supabase } from '@/lib/supabase'
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
    categoryId?: string
    recurrenceId?: string
    centerId?: string
    projectId?: string
    contactId?: string
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    dueDate: Date
    paymentDate?: Date
    competenceDate?: Date
    regime?: 'CAIXA' | 'COMPETENCIA'
    isRecurring?: boolean
    attachmentUrl?: string
    notes?: string
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
    categoryId?: string
    recurrenceId?: string
    centerId?: string
    projectId?: string
    contactId?: string
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    dueDate: Date
    paymentDate?: Date
    competenceDate?: Date
    regime?: 'CAIXA' | 'COMPETENCIA'
    isRecurring?: boolean
    attachmentUrl?: string
    notes?: string
  }[]): Promise<Transaction[]> {
    const transactionsToInsert = transactions.map(t => ({
      user_id: t.userId,
      account_id: t.accountId,
      category_id: t.categoryId,
      recurrence_id: t.recurrenceId,
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
    categoryId?: string
    type?: string
    status?: string
    search?: string
    limit?: number
    page?: number
  }): Promise<any[]> {
    // Buscar transações
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('due_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('due_date', filters.endDate)
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: transactions, error } = await query
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
        ? supabase.from('categories').select('id, name, dre_group').in('id', categoryIds)
        : Promise.resolve({ data: [] }),
    ])

    const accountsMap = new Map((accountsRes.data || []).map((a: any) => [a.id, a.name]))
    const categoriesMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.name]))
    const dreGroupMap = new Map((categoriesRes.data || []).map((c: any) => [c.id, c.dre_group]))

    return transactions.map((t: any) => ({
      ...t,
      account_name: accountsMap.get(t.account_id) ?? null,
      category_name: categoriesMap.get(t.category_id) ?? null,
      category_id: t.category_id ?? null,
      dre_group: dreGroupMap.get(t.category_id) ?? null,
    }))
  }

  // Buscar saldos por conta
  async getBalancesByAccount(userId: string): Promise<AccountBalance[]> {
    // Buscar TODAS as transações para calcular saldo projetado
    const { data: allTransactions, error: errorAll } = await supabase
      .from('transactions')
      .select('account_id, status, amount, type')
      .eq('user_id', userId)

    if (errorAll) throw errorAll

    // Buscar apenas CONCILIADO para calcular saldo confirmado (reconciliado com extrato)
    const { data: confirmedTransactions, error: errorConfirmed } = await supabase
      .from('transactions')
      .select('account_id, status, amount, type')
      .eq('user_id', userId)
      .eq('status', 'CONCILIADO')

    if (errorConfirmed) throw errorConfirmed

    const transactions = allTransactions || []
    const confirmedTxs = confirmedTransactions || []

    if (transactions.length === 0) return []

    const accountIds = [...new Set(transactions.map((t: any) => t.account_id).filter(Boolean))]
    const { data: accountsData } = accountIds.length > 0
      ? await supabase.from('accounts').select('id, name').in('id', accountIds)
      : { data: [] }

    const accountsMap = new Map((accountsData || []).map((a: any) => [a.id, a.name]))

    const balances: { [key: string]: AccountBalance } = {}

    // Inicializa todas as contas
    accountIds.forEach((accountId: string) => {
      const accountName = accountsMap.get(accountId) || '—'
      balances[accountId] = {
        accountId,
        accountName,
        confirmedBalance: 0,
        projectedBalance: 0,
      }
    })

    // Impacto: usa valor direto do banco (receitas positivas, despesas negativas)
    const impact = (t: any): number => Number(t.amount) || 0

    // Projetado = todas as transações
    transactions.forEach((transaction: any) => {
      const accountId = transaction.account_id
      balances[accountId].projectedBalance += impact(transaction)
    })

    // Confirmado = apenas CONCILIADO
    confirmedTxs.forEach((transaction: any) => {
      const accountId = transaction.account_id
      balances[accountId].confirmedBalance += impact(transaction)
    })

    return Object.values(balances)
  }

  // Atualizar transação
  async update(id: string, userId: string, data: Partial<{
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
    dueDate: string
    paymentDate?: string
    competenceDate?: string
    regime?: 'CAIXA' | 'COMPETENCIA'
    accountId?: string
    categoryId?: string
    centerId?: string
    projectId?: string
    contactId?: string
    status?: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
    attachmentUrl?: string
    notes?: string
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
  async sumByAccount(accountId: string, statusFilter?: string[]): Promise<number> {
    let query = supabase
      .from('transactions')
      .select('amount, type')
      .eq('account_id', accountId)

    if (statusFilter && statusFilter.length > 0) {
      query = query.in('status', statusFilter)
    }

    const { data, error } = await query

    if (error) throw error

    if (!data || data.length === 0) return 0

    return data.reduce((sum, transaction) => {
      // Soma direta: receitas são positivas, despesas são negativas no banco
      return sum + Number(transaction.amount)
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

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        categories!inner(id, name),
        amount
      `)
      .eq('user_id', userId)
      .eq('type', filters.type)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])
      .not('category_id', 'is', null)

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

    const { data, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])

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
}

export const transactionRepository = new TransactionRepository()
