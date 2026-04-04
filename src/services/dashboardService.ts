/**
 * CAMADA: Service
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Regras de negócio para dashboard e relatórios
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: TransactionRepository, CategoryRepository, AccountRepository
 */

import { TransactionRepository } from '@/repositories/transactionRepository'
import { CategoryRepository } from '@/repositories/categoryRepository'
import { AccountRepository } from '@/repositories/accountRepository'
import { globalCache } from '@/utils/cache'

export interface DashboardSummary {
  totalBalance: number
  projectedBalance: number
  monthIncome: number
  monthExpense: number
  monthNet: number
  lastMonthIncome: number
  lastMonthExpense: number
  lastMonthNet: number
  incomeVariation: number
  expenseVariation: number
  netVariation: number
}

export interface CategorySummary {
  categoryId: string
  categoryName: string
  categoryColor?: string
  categoryIcon?: string
  total: number
  percentage: number
  transactionCount: number
}

export interface AccountSummary {
  accountId: string
  accountName: string
  accountType: string
  currentBalance: number
  projectedBalance: number
  monthIncome: number
  monthExpense: number
}

export interface RecentTransaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
  dueDate: string
  accountName: string
  categoryName?: string
  tags?: string[]
}

export class DashboardService {
  constructor(
    private transactionRepository: TransactionRepository = new TransactionRepository(),
    private categoryRepository: CategoryRepository = new CategoryRepository(),
    private accountRepository: AccountRepository = new AccountRepository()
  ) {}

  async getDashboardSummary(userId: string): Promise<DashboardSummary> {
    // Gerar chave de cache
    const cacheKey = globalCache.generateKey('dashboard_summary', { userId })
    
    // Tentar obter do cache
    const cached = globalCache.get<DashboardSummary>(cacheKey)
    if (cached) {
      return cached
    }
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    // Paralelizar queries independentes
    const [accounts, currentMonthTransactions, lastMonthTransactions] = await Promise.all([
      this.accountRepository.listWithBalances(userId),
      this.transactionRepository.list(userId, {
        startDate: new Date(currentYear, currentMonth, 1).toISOString(),
        endDate: new Date(currentYear, currentMonth + 1, 0).toISOString()
      }),
      this.transactionRepository.list(userId, {
        startDate: new Date(lastMonthYear, lastMonth, 1).toISOString(),
        endDate: new Date(lastMonthYear, lastMonth + 1, 0).toISOString()
      })
    ])
    
    // Calcular saldos
    const totalBalance = accounts.reduce((sum, account) => sum + account.currentBalance, 0)
    const projectedBalance = accounts.reduce((sum, account) => sum + account.projectedBalance, 0)
    
    // Agregar por tipo em uma única passada
    const aggregateByType = (transactions: any[]) => {
      return transactions.reduce((acc, t) => {
        if (t.type === 'RECEITA') {
          acc.income += t.amount
        } else if (t.type === 'DESPESA') {
          acc.expense += t.amount
        }
        return acc
      }, { income: 0, expense: 0 })
    }
    
    const currentMonthAgg = aggregateByType(currentMonthTransactions || [])
    const lastMonthAgg = aggregateByType(lastMonthTransactions || [])
    
    const monthIncome = currentMonthAgg.income
    const monthExpense = currentMonthAgg.expense
    const monthNet = monthIncome - monthExpense
    
    const lastMonthIncome = lastMonthAgg.income
    const lastMonthExpense = lastMonthAgg.expense
    const lastMonthNet = lastMonthIncome - lastMonthExpense
    
    // Variações percentuais
    const incomeVariation = lastMonthIncome > 0 
      ? ((monthIncome - lastMonthIncome) / lastMonthIncome) * 100 
      : 0
    
    const expenseVariation = lastMonthExpense > 0 
      ? ((monthExpense - lastMonthExpense) / lastMonthExpense) * 100 
      : 0
    
    const netVariation = lastMonthNet > 0 
      ? ((monthNet - lastMonthNet) / Math.abs(lastMonthNet)) * 100 
      : 0
    
    const result = {
      totalBalance,
      projectedBalance,
      monthIncome,
      monthExpense,
      monthNet,
      lastMonthIncome,
      lastMonthExpense,
      lastMonthNet,
      incomeVariation,
      expenseVariation,
      netVariation
    }
    
    // Salvar no cache por 5 minutos
    globalCache.set(cacheKey, result, 5 * 60 * 1000)
    
    return result
  }

  async getCategorySummary(userId: string, type?: 'RECEITA' | 'DESPESA'): Promise<CategorySummary[]> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const transactions = await this.transactionRepository.list(userId, {
      startDate: monthStart.toISOString(),
      endDate: monthEnd.toISOString(),
      type
    })
    
    // Agrupar por categoria
    const categoryMap = new Map<string, {
      total: number
      count: number
      categoryId: string
    }>()
    
    transactions.forEach(transaction => {
      if (transaction.categoryId) {
        const existing = categoryMap.get(transaction.categoryId) || {
          total: 0,
          count: 0,
          categoryId: transaction.categoryId
        }
        
        existing.total += transaction.amount
        existing.count += 1
        
        categoryMap.set(transaction.categoryId, existing)
      }
    })
    
    // Buscar informações das categorias
    const categoryIds = Array.from(categoryMap.keys())
    const categories = await Promise.all(
      categoryIds.map(id => this.categoryRepository.findById(id, userId))
    )
    
    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0)
    
    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => {
        const category = categories.find(c => c?.id === categoryId)
        
        return {
          categoryId,
          categoryName: category?.name || 'Sem categoria',
          categoryColor: category?.color,
          categoryIcon: category?.icon,
          total: data.total,
          percentage: total > 0 ? (data.total / total) * 100 : 0,
          transactionCount: data.count
        }
      })
      .sort((a, b) => b.total - a.total)
  }

  async getAccountSummary(userId: string): Promise<AccountSummary[]> {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const accounts = await this.accountRepository.listWithBalances(userId)
    
    return Promise.all(
      accounts.map(async account => {
        const transactions = await this.transactionRepository.list(userId, {
          accountId: account.id,
          startDate: monthStart.toISOString(),
          endDate: monthEnd.toISOString()
        })
        
        const monthIncome = transactions
          .filter(t => t.type === 'RECEITA')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const monthExpense = transactions
          .filter(t => t.type === 'DESPESA')
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          accountId: account.id,
          accountName: account.name,
          accountType: account.type,
          currentBalance: account.currentBalance,
          projectedBalance: account.projectedBalance,
          monthIncome,
          monthExpense
        }
      })
    )
  }

  async getRecentTransactions(userId: string, limit: number = 10): Promise<RecentTransaction[]> {
    const transactions = await this.transactionRepository.list(userId, {
      limit
    })
    
    return transactions.map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      status: transaction.status,
      dueDate: transaction.dueDate.toISOString(),
      accountName: transaction.account?.name || 'Conta desconhecida',
      categoryName: transaction.category?.name,
      tags: transaction.tags?.map((t: any) => t.name) || []
    }))
  }

  async getMonthlyEvolution(userId: string, months: number = 12): Promise<any[]> {
    const evolution = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth()
      
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month + 1, 0)
      
      const transactions = await this.transactionRepository.list(userId, {
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString()
      })
      
      const income = transactions
        .filter(t => t.type === 'RECEITA')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expense = transactions
        .filter(t => t.type === 'DESPESA')
        .reduce((sum, t) => sum + t.amount, 0)
      
      evolution.push({
        month: monthStart.toISOString(),
        income,
        expense,
        net: income - expense
      })
    }
    
    return evolution
  }
}
