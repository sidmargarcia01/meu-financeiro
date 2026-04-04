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
    type?: string
    status?: string
    limit?: number
  }): Promise<any[]> {
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
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  // Resumo mensal
  async getMonthlySummary(userId: string, months: number = 12): Promise<any[]> {
    const summary = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)
        .gte('due_date', monthStart.toISOString())
        .lte('due_date', monthEnd.toISOString())
      
      if (error) throw error
      
      const income = (data || [])
        .filter(t => t.type === 'RECEITA')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = (data || [])
        .filter(t => t.type === 'DESPESA')
        .reduce((sum, t) => sum + t.amount, 0)
      
      summary.push({
        month: monthStart.toISOString(),
        income,
        expense,
        net: income - expense
      })
    }
    
    return summary
  }

  // Buscar saldos por conta
  async getBalancesByAccount(userId: string): Promise<AccountBalance[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        account_id,
        accounts!inner(name),
        status,
        amount,
        type
      `)
      .eq('user_id', userId)
      .in('status', ['CONFIRMADO', 'CONCILIADO'])
    
    if (error) throw error
    
    const balances: { [key: string]: AccountBalance } = {}
    
    data.forEach(transaction => {
      const accountId = transaction.account_id
      const accountName = (transaction.accounts as any).name
      
      if (!balances[accountId]) {
        balances[accountId] = {
          accountId,
          accountName,
          confirmedBalance: 0,
          projectedBalance: 0,
        }
      }
      
      const amount = Number(transaction.amount)
      if (transaction.type === 'RECEITA') {
        balances[accountId].confirmedBalance += amount
        balances[accountId].projectedBalance += amount
      } else {
        balances[accountId].confirmedBalance -= amount
        balances[accountId].projectedBalance -= amount
      }
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
}
