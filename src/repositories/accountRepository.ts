/**
 * CAMADA: Repository
 * MÓDULO: Account
 * RESPONSABILIDADE: Acesso ao banco de dados para contas
 * NÃO DEVE: Conter regras de negócio ou validação
 * DEPENDE DE: Prisma, Account models
 */

import { prisma } from '@/lib/prisma'
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
    currency?: string
    icon?: string
    bankConnectionId?: string
  }): Promise<Account> {
    const account = await prisma.account.create({
      data,
    })
    
    return {
      ...account,
      initialBalance: Number(account.initialBalance)
    } as Account
  }

  // Buscar conta por ID
  async findById(id: string, userId: string): Promise<Account | null> {
    const account = await prisma.account.findFirst({
      where: { 
        id,
        userId 
      },
    })
    
    if (!account) return null
    
    return {
      ...account,
      initialBalance: Number(account.initialBalance)
    } as Account
  }

  // Buscar conta com cartão de crédito
  async findByIdWithCreditCard(id: string, userId: string): Promise<AccountWithCreditCard | null> {
    const account = await prisma.account.findFirst({
      where: { 
        id,
        userId 
      },
      include: {
        creditCards: true,
      },
    })
    
    if (!account) return null
    
    const creditCard = account.creditCards[0] || null
    
    return {
      ...account,
      initialBalance: Number(account.initialBalance),
      creditCard: creditCard ? {
        ...creditCard,
        creditLimit: creditCard.creditLimit ? Number(creditCard.creditLimit) : undefined
      } : undefined
    } as AccountWithCreditCard
  }

  // Listar contas do usuário
  async list(userId: string, activeOnly: boolean = true): Promise<Account[]> {
    const where: any = { userId }
    if (activeOnly) where.isActive = true
    
    const accounts = await prisma.account.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    return accounts.map(account => ({
      ...account,
      initialBalance: Number(account.initialBalance)
    })) as Account[]
  }

  // Listar contas com saldos
  async listWithBalances(userId: string): Promise<AccountWithBalance[]> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        isActive: true 
      },
      include: {
        transactions: {
          select: {
            amount: true,
            status: true,
          },
        },
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' },
      ],
    })
    
    // Calcular saldos
    return accounts.map((account: any) => {
      const projectedBalance = account.transactions.reduce(
        (sum: number, t: any) => sum + Number(t.amount), 
        Number(account.initialBalance)
      )
      
      const confirmedBalance = account.transactions
        .filter((t: any) => t.status === 'CONFIRMADO' || t.status === 'CONCILIADO')
        .reduce((sum: number, t: any) => sum + Number(t.amount), Number(account.initialBalance))
      
      return {
        ...account,
        currentBalance: projectedBalance,
        projectedBalance,
        confirmedBalance,
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
      currency?: string
      icon?: string
      isActive?: boolean
      bankConnectionId?: string
    }>
  ): Promise<Account> {
    const account = await prisma.account.update({
      where: { 
        id,
        userId 
      },
      data,
    })
    
    return {
      ...account,
      initialBalance: Number(account.initialBalance)
    } as Account
  }

  // Excluir conta
  async delete(id: string, userId: string): Promise<void> {
    await prisma.account.delete({
      where: { 
        id,
        userId 
      },
    })
  }

  // Criar cartão de crédito
  async createCreditCard(data: {
    accountId: string
    creditLimit?: number
    closingDay: number
    dueDay: number
  }): Promise<CreditCard> {
    const creditCard = await prisma.creditCard.create({
      data,
    })
    
    return {
      ...creditCard,
      creditLimit: creditCard.creditLimit ? Number(creditCard.creditLimit) : undefined
    } as CreditCard
  }

  // Buscar cartão de crédito por ID
  async findCreditCardById(id: string): Promise<CreditCard | null> {
    const creditCard = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            userId: true,
          },
        },
      },
    })
    
    if (!creditCard) return null
    
    return {
      ...creditCard,
      creditLimit: creditCard.creditLimit ? Number(creditCard.creditLimit) : undefined
    } as CreditCard
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
    const creditCard = await prisma.creditCard.update({
      where: { id },
      data,
    })
    
    return {
      ...creditCard,
      creditLimit: creditCard.creditLimit ? Number(creditCard.creditLimit) : undefined
    } as CreditCard
  }

  // Excluir cartão de crédito
  async deleteCreditCard(id: string): Promise<void> {
    await prisma.creditCard.delete({
      where: { id },
    })
  }

  // Buscar cartão por account ID
  async findCreditCardByAccountId(accountId: string): Promise<CreditCard | null> {
    const creditCard = await prisma.creditCard.findFirst({
      where: { accountId },
    })

    if (!creditCard) return null
    
    return {
      ...creditCard,
      creditLimit: creditCard.creditLimit ? Number(creditCard.creditLimit) : undefined
    } as CreditCard
  }

  // Verificar se conta existe e pertence ao usuário
  async exists(id: string, userId: string): Promise<boolean> {
    const account = await prisma.account.findFirst({
      where: { 
        id,
        userId 
      },
      select: { id: true },
    })
    
    return !!account
  }

  // Buscar contas por tipo
  async findByType(
    userId: string, 
    type: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
  ): Promise<Account[]> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        type,
        isActive: true 
      },
      orderBy: { name: 'asc' },
    })
    
    return accounts.map(account => ({
      ...account,
      initialBalance: Number(account.initialBalance)
    })) as Account[]
  }

  // Contar contas do usuário
  async count(userId: string, activeOnly: boolean = true): Promise<number> {
    const where: any = { userId }
    if (activeOnly) where.isActive = true
    
    const count = await prisma.account.count({ where })
    
    return count
  }

  // Verificar se conta tem transações vinculadas
  async hasTransactions(accountId: string): Promise<boolean> {
    const count = await prisma.transaction.count({
      where: { accountId },
    })
    
    return count > 0
  }
}

// Exportar instância singleton
export const accountRepository = new AccountRepository()
