/**
 * CAMADA: Service
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Regras de negócio para transações financeiras
 * NÃO DEVE: Acessar banco de dados diretamente
 * DEPENDE DE: TransactionRepository, UserRepository
 */

import { TransactionRepository } from '@/repositories/transactionRepository'
import { UserRepository } from '@/repositories/userRepository'
import { RecurrenceRepository } from '@/repositories/recurrenceRepository'
import { AccountRepository } from '@/repositories/accountRepository'
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
    private userRepository: UserRepository = new UserRepository(),
    private recurrenceRepository: RecurrenceRepository = new RecurrenceRepository(),
    private accountRepository: AccountRepository = new AccountRepository()
  ) { }

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
    // Para DESPESA, amount deve ser negativo para cálculo correto de saldos
    const signedAmount = data.type === 'DESPESA' ? -Math.abs(data.amount) : Math.abs(data.amount)

    // Status baseado no informado ou PENDENTE como padrao
    // A cor do ponto sera determinada por getStatusDotColor baseado na data
    const autoStatus = data.status || 'PENDENTE'

    return this.transactionRepository.create({
      userId,
      description: data.description,
      amount: signedAmount,
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
      status: autoStatus,
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
    const transaction = await this.transactionRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    // Verificar se é uma transação recorrente
    if (transaction.recurrenceId) {
      const recurrence = await this.recurrenceRepository.findById(transaction.recurrenceId, userId)
      if (recurrence && recurrence.isActive) {
        throw new Error('Não é possível editar uma transação recorrente ativa. Desative a recorrência primeiro.')
      }
    }

    // Validações de negócio
    if (data.amount !== undefined) {
      this.validateAmount(data.amount)
    }

    // Validar data de pagamento se fornecida
    if (data.paymentDate !== undefined) {
      this.validatePaymentDate(data.paymentDate, transaction.dueDate)
    }

    // Validar data de competência se fornecida
    if (data.competenceDate !== undefined) {
      this.validateCompetenceDate(data.competenceDate, data.dueDate || transaction.dueDate)
    }

    // Validar regime se fornecido
    if (data.regime !== undefined) {
      this.validateRegime(data.regime, data.competenceDate || transaction.competenceDate)
    }

    // Validar anexo se fornecido
    if (data.attachmentUrl !== undefined) {
      this.validateAttachmentUrl(data.attachmentUrl)
    }

    // Validar tags se fornecidas
    if (data.tags !== undefined) {
      this.validateTags(data.tags)
    }

    // Validar notas se fornecidas
    if (data.notes !== undefined) {
      this.validateNotes(data.notes)
    }

    // Validar IDs de entidades se fornecidos
    if (data.accountId !== undefined && data.accountId !== null) {
      this.validateEntityId(data.accountId, 'accountId')
    }
    if (data.categoryId !== undefined && data.categoryId !== null) {
      this.validateEntityId(data.categoryId, 'categoryId')
    }
    if (data.centerId !== undefined && data.centerId !== null) {
      this.validateEntityId(data.centerId, 'centerId')
    }
    if (data.projectId !== undefined && data.projectId !== null) {
      this.validateEntityId(data.projectId, 'projectId')
    }
    if (data.contactId !== undefined && data.contactId !== null) {
      this.validateEntityId(data.contactId, 'contactId')
    }

    // Validar tipo de transação se fornecido
    if (data.type !== undefined) {
      this.validateTransactionType(data.type, data.accountId)
    }

    // Aplica sinal ao amount: DESPESA=negativo, outros=positivo
    // Usa o tipo da atualização ou o tipo atual da transação
    let signedAmount = data.amount
    if (signedAmount !== undefined) {
      const effectiveType = data.type ?? transaction.type
      signedAmount = effectiveType === 'DESPESA'
        ? -Math.abs(signedAmount)
        : Math.abs(signedAmount)
    }

    return this.transactionRepository.update(transactionId, userId, {
      description: data.description,
      amount: signedAmount,
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
    const transaction = await this.transactionRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    // Verificar se é uma transação recorrente
    if (transaction.recurrenceId) {
      const recurrence = await this.recurrenceRepository.findById(transaction.recurrenceId, userId)
      if (recurrence && recurrence.isActive) {
        throw new Error('Não é possível excluir uma transação recorrente ativa. Desative a recorrência primeiro.')
      }
    }

    return this.transactionRepository.delete(transactionId, userId)
  }

  async deleteTransactionsByRecurrenceId(userId: string, recurrenceId: string, fromDate?: string) {
    // Desativar a recorrência primeiro para liberar as transações
    const recurrence = await this.recurrenceRepository.findById(recurrenceId, userId)
    if (recurrence && recurrence.isActive) {
      await this.recurrenceRepository.update(recurrenceId, userId, { isActive: false })
    }

    return this.transactionRepository.deleteByRecurrenceId(recurrenceId, userId, fromDate)
  }

  async deleteTransactionsByDescription(userId: string, accountId: string, baseDescription: string, fromDate?: string) {
    return this.transactionRepository.deleteByDescriptionPattern(userId, accountId, baseDescription, fromDate)
  }

  async confirmTransaction(userId: string, transactionId: string) {
    // Verificar se transação existe
    const transaction = await this.transactionRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    // Verificar se já está confirmada
    if (transaction.status === 'CONFIRMADO') {
      throw new Error('Transação já está confirmada')
    }

    // Verificar se já está conciliada
    if (transaction.status === 'CONCILIADO') {
      throw new Error('Transação conciliada não pode ser confirmada novamente')
    }

    // Verificar se é uma transação recorrente
    if (transaction.recurrenceId) {
      const recurrence = await this.recurrenceRepository.findById(transaction.recurrenceId, userId)
      if (recurrence && recurrence.isActive) {
        throw new Error('Não é possível confirmar uma transação recorrente ativa. Desative a recorrência primeiro.')
      }
    }

    // Confirmar transação
    return this.transactionRepository.update(transactionId, userId, {
      status: 'CONFIRMADO',
      paymentDate: new Date().toISOString()
    })
  }

  async reconcileTransaction(
    userId: string,
    transactionId: string,
    data?: {
      paymentDate?: string
      amount?: number
      accountId?: string
      notes?: string
    }
  ) {
    // Verificar se transação existe
    const transaction = await this.transactionRepository.findById(transactionId, userId)
    if (!transaction) {
      throw new Error('Transação não encontrada')
    }

    // Verificar se é uma transação recorrente
    if (transaction.recurrenceId) {
      const recurrence = await this.recurrenceRepository.findById(transaction.recurrenceId, userId)
      if (recurrence && recurrence.isActive) {
        throw new Error('Não é possível conciliar uma transação recorrente ativa. Desative a recorrência primeiro.')
      }
    }

    // Preparar dados de atualização
    const updateData: any = {
      status: 'CONCILIADO',
      paymentDate: data?.paymentDate || transaction.paymentDate || new Date().toISOString(),
    }

    if (data?.amount !== undefined && !isNaN(data.amount)) {
      // Aplicar sinal correto: DESPESA = negativo, demais = positivo
      updateData.amount = transaction.type === 'DESPESA'
        ? -Math.abs(data.amount)
        : Math.abs(data.amount)
    }
    if (data?.accountId) {
      updateData.accountId = data.accountId
    }
    if (data?.notes !== undefined) {
      updateData.notes = data.notes
    }

    return this.transactionRepository.update(transactionId, userId, updateData)
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

  async getMonthlySummary(userId: string, months: number = 12): Promise<any> {
    const now = new Date()
    return this.transactionRepository.getMonthlySummary(userId, now.getMonth() + 1, now.getFullYear())
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

  private validatePaymentDate(paymentDate: string | Date | null | undefined, dueDate: string | Date) {
    if (!paymentDate) {
      return // Data de pagamento é opcional
    }

    const payment = new Date(paymentDate)
    const due = new Date(dueDate)

    // Verificar se é uma data válida
    if (isNaN(payment.getTime())) {
      throw new Error('Data de pagamento inválida')
    }

    // Verificar se não é uma data futura (permitir até 1 dia no futuro para compensar fuso horário)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (payment > tomorrow) {
      throw new Error('Data de pagamento não pode ser futura')
    }

    // Verificar se não é muito antiga (mais de 5 anos)
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    if (payment < fiveYearsAgo) {
      throw new Error('Data de pagamento muito antiga. Permitido apenas até 5 anos atrás')
    }
  }

  private validateCompetenceDate(competenceDate: string | Date | null | undefined, dueDate: string | Date) {
    if (!competenceDate) {
      return // Data de competência é opcional
    }

    const competence = new Date(competenceDate)
    const due = new Date(dueDate)

    // Verificar se é uma data válida
    if (isNaN(competence.getTime())) {
      throw new Error('Data de competência inválida')
    }

    // Verificar se não é muito antiga (mais de 2 anos antes da data de vencimento)
    const twoYearsBeforeDue = new Date(due)
    twoYearsBeforeDue.setFullYear(twoYearsBeforeDue.getFullYear() - 2)
    if (competence < twoYearsBeforeDue) {
      throw new Error('Data de competência muito antiga. Permitido apenas até 2 anos antes do vencimento')
    }

    // Verificar se não é muito futura (mais de 6 meses após o vencimento)
    const sixMonthsAfterDue = new Date(due)
    sixMonthsAfterDue.setMonth(sixMonthsAfterDue.getMonth() + 6)
    if (competence > sixMonthsAfterDue) {
      throw new Error('Data de competência muito futura. Permitido apenas até 6 meses após o vencimento')
    }
  }

  private validateRegime(regime: string | null | undefined, competenceDate: string | Date | null | undefined) {
    if (!regime) {
      return // Regime é opcional (default é CAIXA)
    }

    const validRegimes = ['CAIXA', 'COMPETENCIA']
    if (!validRegimes.includes(regime)) {
      throw new Error(`Regime inválido. Valores permitidos: ${validRegimes.join(', ')}`)
    }

    // Se regime é COMPETENCIA, data de competência é obrigatória
    if (regime === 'COMPETENCIA' && !competenceDate) {
      throw new Error('Data de competência é obrigatória quando o regime é COMPETENCIA')
    }
  }

  private validateAttachmentUrl(attachmentUrl: string | null | undefined) {
    if (!attachmentUrl) {
      return // Anexo é opcional
    }

    // Verificar se é uma URL válida
    try {
      new URL(attachmentUrl)
    } catch {
      throw new Error('URL do anexo inválida')
    }

    // Verificar se o protocolo é HTTP/HTTPS
    const url = new URL(attachmentUrl)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('URL do anexo deve usar HTTP ou HTTPS')
    }

    // Verificar se a extensão é permitida
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.xls', '.xlsx']
    const extension = url.pathname.toLowerCase().split('.').pop()
    if (!extension || !allowedExtensions.includes(`.${extension}`)) {
      throw new Error(`Tipo de arquivo não permitido. Extensões permitidas: ${allowedExtensions.join(', ')}`)
    }
  }

  private validateTags(tags: string[] | null | undefined) {
    if (!tags) {
      return // Tags são opcionais
    }

    // Verificar se é um array
    if (!Array.isArray(tags)) {
      throw new Error('Tags devem ser um array')
    }

    // Verificar limite de tags (máximo 10)
    if (tags.length > 10) {
      throw new Error('Máximo de 10 tags permitidas por transação')
    }

    // Verificar se todas as tags são strings válidas
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        throw new Error('Todas as tags devem ser strings')
      }

      // Verificar se não está vazia
      if (!tag.trim()) {
        throw new Error('Tags não podem estar vazias')
      }

      // Verificar tamanho máximo (50 caracteres)
      if (tag.length > 50) {
        throw new Error('Cada tag pode ter no máximo 50 caracteres')
      }

      // Verificar formato (permitir apenas letras, números, espaços, hífens e underscores)
      const validTagPattern = /^[a-zA-Z0-9\s\-_]+$/
      if (!validTagPattern.test(tag)) {
        throw new Error('Tags podem conter apenas letras, números, espaços, hífens e underscores')
      }
    }

    // Verificar se não há tags duplicadas
    const uniqueTags = new Set(tags.map(t => t.toLowerCase().trim()))
    if (uniqueTags.size !== tags.length) {
      throw new Error('Tags duplicadas não são permitidas')
    }
  }

  private validateNotes(notes: string | null | undefined) {
    if (!notes) {
      return // Notas são opcionais
    }

    // Verificar se é string
    if (typeof notes !== 'string') {
      throw new Error('Notas devem ser uma string')
    }

    // Verificar tamanho máximo (1000 caracteres)
    if (notes.length > 1000) {
      throw new Error('Notas podem ter no máximo 1000 caracteres')
    }

    // Verificar se não está vazia após trim
    if (notes.trim().length === 0) {
      throw new Error('Notas não podem estar vazias')
    }
  }

  private validateEntityId(id: string, fieldName: string) {
    // Verificar se é string
    if (typeof id !== 'string') {
      throw new Error(`${fieldName} deve ser uma string`)
    }

    // Verificar se não está vazio
    if (!id.trim()) {
      throw new Error(`${fieldName} não pode estar vazio`)
    }

    // Verificar formato UUID (versão 4)
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidV4Pattern.test(id)) {
      throw new Error(`${fieldName} deve ser um UUID válido`)
    }
  }

  private validateTransactionType(type: string, accountId?: string | null) {
    const validTypes = ['RECEITA', 'DESPESA', 'TRANSFERENCIA']

    // Verificar se o tipo é válido
    if (!validTypes.includes(type)) {
      throw new Error(`Tipo de transação inválido. Valores permitidos: ${validTypes.join(', ')}`)
    }

    // Se for transferência, accountId é obrigatório
    if (type === 'TRANSFERENCIA' && !accountId) {
      throw new Error('Conta de origem é obrigatória para transferências')
    }
  }

  private async createRecurringTransaction(
    userId: string,
    data: CreateTransactionInput & { isRecurring: boolean; recurrenceData: any }
  ) {
    if (data.recurrenceData.type === 'PARCELADA') {
      return this.createInstallmentTransaction({
        userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        centerId: data.centerId,
        projectId: data.projectId,
        contactId: data.contactId,
        description: data.description,
        installmentAmount: data.amount,
        installments: data.recurrenceData.totalInstallments,
        dueDate: data.recurrenceData.firstDueDate,
        type: data.type as 'RECEITA' | 'DESPESA',
        installmentType: 'VALOR_PARCELA',
        regime: data.regime,
        notes: data.notes
      })
    }

    if (data.recurrenceData.type === 'FIXA') {
      return this.createFixedTransaction(userId, data)
    }

    throw new Error('Tipo de recorrência inválido')
  }

  private async createFixedTransaction(
    userId: string,
    data: CreateTransactionInput & {
      isRecurring: boolean;
      recurrenceData: { type: 'FIXA'; frequency: string; endDate?: string }
    }
  ) {
    const { frequency, endDate } = data.recurrenceData

    // Validações de recorrência
    if (!frequency) {
      throw new Error('Frequência é obrigatória para recorrência fixa')
    }

    const validFrequencies = ['MENSAL', 'ANUAL', 'SEMANAL']
    if (!validFrequencies.includes(frequency)) {
      throw new Error(`Frequência inválida. Valores permitidos: ${validFrequencies.join(', ')}`)
    }

    if (endDate && new Date(endDate) <= new Date(data.dueDate)) {
      throw new Error('Data de fim deve ser posterior à data de início')
    }

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
    // Validações específicas para transferência
    if (!data.accountId) {
      throw new Error('Conta de origem é obrigatória para transferência')
    }

    if (!data.transferData.destinationAccountId) {
      throw new Error('Conta de destino é obrigatória para transferência')
    }

    if (data.accountId === data.transferData.destinationAccountId) {
      throw new Error('Conta de origem e destino não podem ser as mesmas')
    }

    // Verificar se ambas as contas pertencem ao usuário
    const [sourceAccount, destinationAccount] = await Promise.all([
      this.accountRepository.findById(data.accountId, userId),
      this.accountRepository.findById(data.transferData.destinationAccountId, userId)
    ])

    if (!sourceAccount || !destinationAccount) {
      throw new Error('Uma ou ambas as contas não foram encontradas')
    }

    // Criar transação de débito na origem (valor negativo = saída da conta)
    const debitAmount = -Math.abs(data.amount)
    const creditAmount = Math.abs(data.amount)
    const debitTransaction = await this.transactionRepository.create({
      userId,
      description: `Transferência para ${destinationAccount.name}`,
      amount: debitAmount,
      type: 'DESPESA',
      dueDate: new Date(data.dueDate),
      regime: data.regime || 'CAIXA',
      accountId: data.accountId,
      status: 'CONFIRMADO',
      isRecurring: false,
      notes: data.notes,
    })

    // Criar transação de crédito no destino (valor positivo = entrada na conta)
    await this.transactionRepository.create({
      userId,
      description: `Transferência de ${sourceAccount.name}`,
      amount: creditAmount,
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

  // Criar transação parcelada
  async createInstallmentTransaction(data: {
    userId: string
    accountId?: string
    categoryId?: string
    centerId?: string
    projectId?: string
    contactId?: string
    description: string
    totalAmount?: number
    installmentAmount?: number
    installments: number
    dueDate: string
    type: 'RECEITA' | 'DESPESA'
    installmentType: 'VALOR_TOTAL' | 'VALOR_PARCELA'
    regime?: 'CAIXA' | 'COMPETENCIA'
    notes?: string
  }) {
    // Validações
    if (data.installments < 2) {
      throw new Error('Número de parcelas deve ser maior que 1')
    }

    // Verificar limites do plano
    await this.checkPlanLimits(data.userId)

    // Criar recorrência (opcional: se falhar por RLS/permissão, segue sem o vínculo)
    let recurrenceId: string | undefined
    try {
      const recurrence = await this.recurrenceRepository.create({
        userId: data.userId,
        type: 'PARCELADA',
        totalInstallments: data.installments,
        currentInstallment: 1,
        isActive: true
      })
      recurrenceId = recurrence.id
    } catch (recErr: any) {
      console.warn('[createInstallmentTransaction] recurrences table unavailable, proceeding without recurrenceId:', recErr?.message)
    }

    // Calcular valor das parcelas
    let installmentValue: number
    if (data.installmentType === 'VALOR_TOTAL' && data.totalAmount) {
      installmentValue = data.totalAmount / data.installments
    } else if (data.installmentType === 'VALOR_PARCELA' && data.installmentAmount) {
      installmentValue = data.installmentAmount
    } else {
      throw new Error('É necessário informar totalAmount para VALOR_TOTAL ou installmentAmount para VALOR_PARCELA')
    }

    // Sinal correto do valor: DESPESA = negativo
    const signedValue = data.type === 'DESPESA' ? -Math.abs(installmentValue) : Math.abs(installmentValue)

    // Parse da data em fuso local (evita off-by-1-day do new Date('YYYY-MM-DD') UTC)
    const datePart = data.dueDate.split('T')[0]
    const [baseYear, baseMonth, baseDay] = datePart.split('-').map(Number)

    // Gerar parcelas
    const transactions = []

    for (let i = 0; i < data.installments; i++) {
      const dueDate = new Date(baseYear, baseMonth - 1 + i, baseDay)

      transactions.push({
        userId: data.userId,
        accountId: data.accountId,
        categoryId: data.categoryId,
        recurrenceId,
        centerId: data.centerId,
        projectId: data.projectId,
        contactId: data.contactId,
        description: `${data.description} - Parcela ${i + 1}/${data.installments}`,
        amount: signedValue,
        type: data.type,
        dueDate,
        regime: data.regime || 'CAIXA',
        status: 'PENDENTE' as const,
        isRecurring: true,
        notes: data.notes
      })
    }

    // Criar todas as transações
    const createdTransactions = await this.transactionRepository.createMany(transactions)

    return {
      recurrenceId,
      transactions: createdTransactions
    }
  }

  private async checkPlanLimits(userId: string) {
    const plan = await this.userRepository.getUserPlan(userId)
    const currentCount = await this.transactionRepository.countByUserMonth(
      userId,
      new Date().getMonth() + 1,
      new Date().getFullYear()
    )

    if (plan && currentCount >= plan.transactionLimit) {
      throw new Error(`Limite mensal de lançamentos atingido. Seu plano permite até ${plan.transactionLimit} lançamentos por mês.`)
    }
  }
}
