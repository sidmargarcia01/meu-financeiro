/**
 * CAMADA: Service
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Regras de negócio para transações financeiras
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: TransactionRepository, UserRepository
 */

import { TransactionRepository } from '@/repositories/transactionRepository'
import { UserRepository } from '@/repositories/userRepository'
import { 
  CreateTransactionInput, 
  UpdateTransactionInput,
  TransactionFilters,
  AccountBalance,
  MonthlySummary
} from '@/models/transaction'

export class TransactionService {
  constructor(
    private transactionRepository: TransactionRepository = new TransactionRepository(),
    private userRepository: UserRepository = new UserRepository()
  ) {}

  async createTransaction(
    userId: string, 
    data: CreateTransactionInput
  ) {
    // Validações de negócio
    this.validateTransactionData(data)
    
    // Verificar limites do plano
    await this.checkPlanLimits(userId)
    
    // Processar recorrências se houver
    if (data.isRecurring && data.recurrenceData) {
      return this.createRecurringTransaction(userId, data as CreateTransactionInput & { isRecurring: boolean; recurrenceData: any })
    }
    
    // Processar transferências se houver
    if (data.type === 'TRANSFERENCIA' && data.transferData) {
      return this.createTransferTransaction(userId, data as CreateTransactionInput & { type: 'TRANSFERENCIA'; transferData: { destinationAccountId: string } })
    }
    
    // Criar transação simples
    return this.transactionRepository.create({
      userId,
      description: data.description,
      amount: data.amount,
      type: data.type,
      dueDate: new Date(data.dueDate),
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      competenceDate: data.competenceDate ? new Date(data.competenceDate) : undefined,
      regime: data.regime || 'CAIXA',
      accountId: data.accountId,
      categoryId: data.categoryId,
      centerId: data.centerId,
      projectId: data.projectId,
      contactId: data.contactId,
      status: data.status || 'PENDENTE',
      isRecurring: data.isRecurring || false,
      attachmentUrl: data.attachmentUrl,
      notes: data.notes,
    })
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    data: UpdateTransactionInput
  ) {
    // Verificar se transação existe
    const exists = await this.transactionRepository.exists(transactionId, userId)
    if (!exists) {
      throw new Error('Transação não encontrada')
    }
    
    // Validações de negócio
    if (data.amount !== undefined) {
      this.validateAmount(data.amount)
    }
    
    return this.transactionRepository.update(transactionId, userId, {
      description: data.description,
      amount: data.amount,
      type: data.type,
      dueDate: data.dueDate,
      paymentDate: data.paymentDate,
      competenceDate: data.competenceDate,
      regime: data.regime,
      accountId: data.accountId,
      categoryId: data.categoryId,
      centerId: data.centerId,
      projectId: data.projectId,
      contactId: data.contactId,
      status: data.status,
      attachmentUrl: data.attachmentUrl,
      notes: data.notes,
    })
  }

  async deleteTransaction(userId: string, transactionId: string) {
    // Verificar se transação existe
    const exists = await this.transactionRepository.exists(transactionId, userId)
    if (!exists) {
      throw new Error('Transação não encontrada')
    }
    
    return this.transactionRepository.delete(transactionId, userId)
  }

  async getTransaction(userId: string, transactionId: string) {
    return this.transactionRepository.findById(transactionId, userId)
  }

  async listTransactions(
    userId: string,
    filters: TransactionFilters,
    pagination: { page: number; limit: number }
  ) {
    return this.transactionRepository.list(userId, { ...filters, ...pagination })
  }

  async calculateBalances(userId: string): Promise<AccountBalance[]> {
    return this.transactionRepository.getBalancesByAccount(userId)
  }

  async getMonthlySummary(userId: string, months: number = 12): Promise<MonthlySummary[]> {
    return this.transactionRepository.getMonthlySummary(userId, months)
  }

  // Métodos privados

  private validateTransactionData(data: CreateTransactionInput) {
    this.validateAmount(data.amount)
    
    if (!data.accountId && data.type !== 'TRANSFERENCIA') {
      throw new Error('Conta é obrigatória')
    }
    
    if (!data.description || data.description.trim().length === 0) {
      throw new Error('Descrição é obrigatória')
    }
  }

  private validateAmount(amount: number) {
    if (amount <= 0) {
      throw new Error('Valor deve ser positivo')
    }
  }

  private async checkPlanLimits(userId: string) {
    const currentCount = await this.userRepository.countTransactionsThisMonth(userId)
    const user = await this.userRepository.findById(userId)
    
    if (!user) {
      throw new Error('Usuário não encontrado')
    }
    
    // Se não tem plano, é admin - sem limites
    if (!user.planId) {
      return
    }
    
    const plan = await this.userRepository.getUserPlan(userId)
    if (!plan) {
      return
    }
    
    if (currentCount >= plan.transactionLimit) {
      throw new Error('Limite mensal de transações atingido')
    }
  }

  private async createRecurringTransaction(
    userId: string, 
    data: CreateTransactionInput & { isRecurring: boolean; recurrenceData: any }
  ) {
    if (data.recurrenceData.type === 'PARCELADA') {
      return this.createInstallmentTransaction(userId, data)
    }
    
    if (data.recurrenceData.type === 'FIXA') {
      return this.createFixedTransaction(userId, data)
    }
    
    throw new Error('Tipo de recorrência inválido')
  }

  private async createInstallmentTransaction(
    userId: string,
    data: CreateTransactionInput & { 
      isRecurring: boolean; 
      recurrenceData: { 
        type: 'PARCELADA'; 
        totalInstallments: number; 
        firstDueDate: string 
      } 
    }
  ) {
    const { totalInstallments, firstDueDate } = data.recurrenceData
    const installmentAmount = data.amount / totalInstallments
    
    const transactions = []
    const baseDate = new Date(firstDueDate)
    
    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(baseDate)
      dueDate.setMonth(dueDate.getMonth() + i)
      
      const transaction = await this.transactionRepository.create({
        userId,
        description: `${data.description} ${i + 1}/${totalInstallments}`,
        amount: installmentAmount,
        type: data.type,
        dueDate,
        regime: data.regime || 'CAIXA',
        accountId: data.accountId,
        categoryId: data.categoryId,
        centerId: data.centerId,
        projectId: data.projectId,
        contactId: data.contactId,
        status: 'PENDENTE',
        isRecurring: true,
        notes: data.notes,
      })
      
      transactions.push(transaction)
    }
    
    return transactions[0] // Retornar primeira parcela
  }

  private async createFixedTransaction(
    userId: string,
    data: CreateTransactionInput & { 
      isRecurring: boolean; 
      recurrenceData: { type: 'FIXA'; frequency: string; endDate?: string }
    }
  ) {
    const { frequency, endDate } = data.recurrenceData
    const baseDate = new Date(data.dueDate)
    const finalDate = endDate ? new Date(endDate) : new Date(baseDate)
    finalDate.setMonth(finalDate.getMonth() + 6) // Simplificado: 6 meses sem data fim
    
    const transactions = []
    const currentDate = new Date(baseDate)
    
    while (currentDate <= finalDate) {
      const transaction = await this.transactionRepository.create({
        userId,
        description: data.description,
        amount: data.amount,
        type: data.type,
        dueDate: new Date(currentDate),
        regime: data.regime || 'CAIXA',
        accountId: data.accountId,
        categoryId: data.categoryId,
        centerId: data.centerId,
        projectId: data.projectId,
        contactId: data.contactId,
        status: 'PENDENTE',
        isRecurring: true,
        notes: data.notes,
      })
      
      transactions.push(transaction)
      
      // Avançar para próxima data
      if (frequency === 'MENSAL') {
        currentDate.setMonth(currentDate.getMonth() + 1)
      } else if (frequency === 'ANUAL') {
        currentDate.setFullYear(currentDate.getFullYear() + 1)
      } else if (frequency === 'SEMANAL') {
        currentDate.setDate(currentDate.getDate() + 7)
      }
    }
    
    return transactions[0] // Retornar primeira transação
  }

  private async createTransferTransaction(
    userId: string,
    data: CreateTransactionInput & { 
      type: 'TRANSFERENCIA'; 
      transferData: { destinationAccountId: string }
    }
  ) {
    // Criar transação de débito na origem
    const debitTransaction = await this.transactionRepository.create({
      userId,
      description: `Transferência para ${data.transferData.destinationAccountId}`,
      amount: data.amount,
      type: 'DESPESA',
      dueDate: new Date(data.dueDate),
      regime: data.regime || 'CAIXA',
      accountId: data.accountId,
      status: 'CONFIRMADO',
      isRecurring: false,
      notes: data.notes,
    })
    
    // Criar transação de crédito no destino
    await this.transactionRepository.create({
      userId,
      description: `Transferência de ${data.accountId}`,
      amount: data.amount,
      type: 'RECEITA',
      dueDate: new Date(data.dueDate),
      regime: data.regime || 'CAIXA',
      accountId: data.transferData.destinationAccountId,
      status: 'CONFIRMADO',
      isRecurring: false,
      notes: data.notes,
    })
    
    return debitTransaction // Retornar transação de débito
  }
}
