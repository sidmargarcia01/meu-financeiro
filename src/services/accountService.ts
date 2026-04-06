/**
 * CAMADA: Service
 * MÓDULO: Account
 * RESPONSABILIDADE: Regras de negócio para gestão de contas bancárias
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: AccountRepository
 */

import { AccountRepository } from '@/repositories/accountRepository'
import { TransactionRepository } from '@/repositories/transactionRepository'
import { UserRepository } from '@/repositories/userRepository'
import { createAccountSchema, updateAccountSchema, createCreditCardSchema } from '@/models/account'
import type { z } from 'zod'

type CreateAccountInput = z.infer<typeof createAccountSchema>
type UpdateAccountInput = z.infer<typeof updateAccountSchema>
type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>

export class AccountService {
  constructor(
    private accountRepository: AccountRepository = new AccountRepository(),
    private transactionRepository: TransactionRepository = new TransactionRepository(),
    private userRepository: UserRepository = new UserRepository()
  ) {}

  async create(userId: string, data: z.infer<typeof createAccountSchema>) {
    // Validações de negócio
    this.validateAccountData(data)
    
    // Verificar limite de contas do plano
    const accountCount = await this.accountRepository.count(userId)
    const maxAccounts = await this.getMaxAccountsForUser(userId)
    
    if (accountCount >= maxAccounts) {
      throw new Error(`Limite de contas atingido (${maxAccounts} contas)`)
    }
    
    // Criar conta
    return this.accountRepository.create({
      userId,
      name: data.name,
      type: data.type,
      initialBalance: data.initialBalance ?? 0,
      currency: data.currency || 'BRL',
      icon: data.icon,
      bankConnectionId: data.bankConnectionId,
    })
  }

  async list(userId: string, activeOnly: boolean = true) {
    return this.accountRepository.list(userId, activeOnly)
  }

  async listWithBalances(userId: string) {
    return this.accountRepository.listWithBalances(userId)
  }

  async findById(userId: string, accountId: string) {
    const account = await this.accountRepository.findById(accountId, userId)
    
    if (!account) {
      throw new Error('Conta não encontrada')
    }
    
    return account
  }

  async update(userId: string, accountId: string, data: UpdateAccountInput) {
    // Verificar se conta existe
    const existingAccount = await this.accountRepository.findById(accountId, userId)
    if (!existingAccount) {
      throw new Error('Conta não encontrada')
    }
    
    // Validações
    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new Error('Nome da conta é obrigatório')
    }
    
    return this.accountRepository.update(accountId, userId, data)
  }

  async delete(userId: string, accountId: string) {
    // Verificar se conta existe
    const account = await this.accountRepository.findById(accountId, userId)
    if (!account) {
      throw new Error('Conta não encontrada')
    }
    
    // Verificar se há transações vinculadas
    const hasTransactions = await this.accountRepository.hasTransactions(accountId)
    if (hasTransactions) {
      throw new Error('Conta possui lançamentos e não pode ser excluída. Arquive-a em vez de excluir.')
    }
    
    return this.accountRepository.delete(accountId, userId)
  }

  async createCreditCard(data: CreateCreditCardInput) {
    // Validações
    if (data.closingDay < 1 || data.closingDay > 31) {
      throw new Error('Dia de fechamento deve estar entre 1 e 31')
    }
    
    if (data.dueDay < 1 || data.dueDay > 31) {
      throw new Error('Dia de vencimento deve estar entre 1 e 31')
    }
    
    if (data.creditLimit !== undefined && data.creditLimit <= 0) {
      throw new Error('Limite de crédito deve ser positivo')
    }
    
    return this.accountRepository.createCreditCard(data)
  }

  async findCreditCardById(creditCardId: string) {
    return this.accountRepository.findCreditCardById(creditCardId)
  }

  async findCreditCardByAccountId(accountId: string) {
    return this.accountRepository.findCreditCardByAccountId(accountId)
  }

  async updateCreditCard(creditCardId: string, data: Partial<CreateCreditCardInput>) {
    // Verificar se cartão existe
    const existingCard = await this.accountRepository.findCreditCardById(creditCardId)
    if (!existingCard) {
      throw new Error('Cartão de crédito não encontrado')
    }
    
    // Validações
    if (data.closingDay !== undefined && (data.closingDay < 1 || data.closingDay > 31)) {
      throw new Error('Dia de fechamento deve estar entre 1 e 31')
    }
    
    if (data.dueDay !== undefined && (data.dueDay < 1 || data.dueDay > 31)) {
      throw new Error('Dia de vencimento deve estar entre 1 e 31')
    }
    
    if (data.creditLimit !== undefined && data.creditLimit <= 0) {
      throw new Error('Limite de crédito deve ser positivo')
    }
    
    return this.accountRepository.updateCreditCard(creditCardId, data)
  }

  async deleteCreditCard(creditCardId: string) {
    // Verificar se cartão existe
    const existingCard = await this.accountRepository.findCreditCardById(creditCardId)
    if (!existingCard) {
      throw new Error('Cartão de crédito não encontrado')
    }
    
    return this.accountRepository.deleteCreditCard(creditCardId)
  }

  async findByType(userId: string, type: CreateAccountInput['type']) {
    return this.accountRepository.findByType(userId, type)
  }

  // Calcular saldo projetado e confirmado
  async calculateBalance(accountId: string, userId: string) {
    // Buscar conta para verificar ownership e obter saldo inicial
    const account = await this.accountRepository.findById(accountId, userId)
    if (!account) {
      throw new Error('Conta não encontrada')
    }

    // Calcular saldo projetado (soma PENDENTE + CONFIRMADO + CONCILIADO)
    const projectedSum = await this.transactionRepository.sumByAccount(
      accountId, 
      ['PENDENTE', 'CONFIRMADO', 'CONCILIADO']
    )

    // Calcular saldo confirmado (soma apenas CONFIRMADO + CONCILIADO)
    const confirmedSum = await this.transactionRepository.sumByAccount(
      accountId, 
      ['CONFIRMADO', 'CONCILIADO']
    )

    // Saldo inicial + somas
    const projected = account.initialBalance + projectedSum
    const confirmed = account.initialBalance + confirmedSum

    return {
      projected,
      confirmed
    }
  }

  // Métodos privados

  private validateAccountData(data: CreateAccountInput) {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Nome da conta é obrigatório')
    }
    
    if (!data.type) {
      throw new Error('Tipo da conta é obrigatório')
    }
    
    if (data.initialBalance !== undefined && data.initialBalance < 0) {
      throw new Error('Saldo inicial não pode ser negativo')
    }
    
    if (data.currency && data.currency.length !== 3) {
      throw new Error('Moeda deve ter 3 caracteres (ex: BRL, USD)')
    }
  }

  private async getMaxAccountsForUser(userId: string): Promise<number> {
    // Buscar plano do usuário
    const plan = await this.userRepository.getUserPlan(userId)
    
    // Se não tem plano, é admin - sem limite
    if (!plan || !plan.userLimit) {
      return Number.MAX_SAFE_INTEGER
    }
    
    return plan.userLimit
  }
}
