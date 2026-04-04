/**
 * CAMADA: Test
 * MÓDULO: Transaction Service
 * RESPONSABILIDADE: Testes unitários do serviço de transações
 * NÃO DEVE: Acessar banco de dados real ou dependências externas
 * DEPENDE DE: Jest, mocks
 */

import { TransactionService } from '@/services/transactionService'
import { TransactionRepository } from '@/repositories/transactionRepository'
import { UserRepository } from '@/repositories/userRepository'
import { CreateTransactionInput, TransactionFilters } from '@/models/transaction'

// Mock dos repositórios
jest.mock('@/repositories/transactionRepository')
jest.mock('@/repositories/userRepository')

const mockUserRepository = {
  findById: jest.fn(),
  countTransactionsThisMonth: jest.fn(),
  getUserPlan: jest.fn(),
  getStorageUsage: jest.fn(),
  update: jest.fn()
} as any

const mockTransactionRepository = {
  exists: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findById: jest.fn(),
  list: jest.fn(),
  getBalancesByAccount: jest.fn(),
  getMonthlySummary: jest.fn()
} as any

describe('TransactionService', () => {
  let transactionService: TransactionService
  const mockUserId = 'user-123'
  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    planId: 'plan-123',
    defaultCurrency: 'BRL',
  }

  beforeEach(() => {
    jest.resetAllMocks()
    transactionService = new TransactionService(mockTransactionRepository as any, mockUserRepository as any)
    
    // Mock do usuário
    mockUserRepository.findById.mockResolvedValue(mockUser)
    mockUserRepository.countTransactionsThisMonth.mockResolvedValue(50)
    mockUserRepository.getUserPlan.mockResolvedValue({
      id: 'plan-id',
      name: 'Pessoal',
      type: 'pessoal',
      transactionLimit: 250,
      userLimit: 0,
      storageLimitMb: 50,
      features: {}
    })
    
    // Mock do exists para retornar true nos testes de update/delete
    mockTransactionRepository.exists.mockResolvedValue(true)
    
    // Mock padrão para create
    mockTransactionRepository.create.mockResolvedValue({
      id: 'transaction-123',
      userId: mockUserId,
      description: 'Test Transaction',
      amount: 100,
      type: 'DESPESA',
      status: 'PENDENTE',
      dueDate: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    
    // Mock padrão para getBalancesByAccount
    mockTransactionRepository.getBalancesByAccount.mockResolvedValue([
      {
        accountId: 'account-1',
        accountName: 'Conta Corrente',
        confirmedBalance: 1000,
        projectedBalance: 1500,
      },
      {
        accountId: 'account-2',
        accountName: 'Poupança',
        confirmedBalance: 5000,
        projectedBalance: 5000,
      }
    ])
  })

  describe('createTransaction', () => {
    it('deve criar transação com dados válidos', async () => {
      const transactionData: CreateTransactionInput = {
        description: 'Test Transaction',
        amount: 100,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-123',
        isRecurring: false,
        tags: [],
      }

      const mockTransaction = {
        id: 'transaction-123',
        userId: mockUserId,
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTransactionRepository.create.mockResolvedValue(mockTransaction)

      const result = await transactionService.createTransaction(mockUserId, transactionData)

      expect(result).toEqual(mockTransaction)
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        description: transactionData.description,
        amount: transactionData.amount,
        type: transactionData.type,
        dueDate: new Date(transactionData.dueDate),
        paymentDate: transactionData.paymentDate ? new Date(transactionData.paymentDate) : undefined,
        competenceDate: transactionData.competenceDate ? new Date(transactionData.competenceDate) : undefined,
        regime: transactionData.regime || 'CAIXA',
        accountId: transactionData.accountId,
        categoryId: transactionData.categoryId,
        centerId: transactionData.centerId,
        projectId: transactionData.projectId,
        contactId: transactionData.contactId,
        status: transactionData.status || 'PENDENTE',
        isRecurring: transactionData.isRecurring || false,
        attachmentUrl: transactionData.attachmentUrl,
        notes: transactionData.notes,
      })
    })

    it('deve rejeitar transação com valor negativo', async () => {
      const transactionData: CreateTransactionInput = {
        description: 'Invalid Transaction',
        amount: -100,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-123',
        isRecurring: false,
        tags: [],
      }

      await expect(
        transactionService.createTransaction(mockUserId, transactionData)
      ).rejects.toThrow('Valor deve ser positivo')

      expect(mockTransactionRepository.create).not.toHaveBeenCalled()
    })

    it('deve rejeitar transação sem conta vinculada', async () => {
      const transactionData: CreateTransactionInput = {
        description: 'Transaction without account',
        amount: 100,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        isRecurring: false,
        tags: [],
      }

      await expect(
        transactionService.createTransaction(mockUserId, transactionData)
      ).rejects.toThrow('Conta é obrigatória')

      expect(mockTransactionRepository.create).not.toHaveBeenCalled()
    })

    it('deve rejeitar quando limite mensal do plano for atingido', async () => {
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(250) // Limite atingido

      const transactionData: CreateTransactionInput = {
        description: 'Test Transaction',
        amount: 100,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-123',
        isRecurring: false,
        tags: [],
      }

      await expect(
        transactionService.createTransaction(mockUserId, transactionData)
      ).rejects.toThrow('Limite mensal de transações atingido')

      expect(mockTransactionRepository.create).not.toHaveBeenCalled()
    })
  })

  describe('calculateBalances', () => {
    it('deve calcular saldo projetado somando confirmados e pendentes', async () => {
      const result = await transactionService.calculateBalances(mockUserId)

      expect(result).toEqual([
        {
          accountId: 'account-1',
          accountName: 'Conta Corrente',
          confirmedBalance: 1000,
          projectedBalance: 1500,
        },
        {
          accountId: 'account-2',
          accountName: 'Poupança',
          confirmedBalance: 5000,
          projectedBalance: 5000,
        }
      ])
      expect(mockTransactionRepository.getBalancesByAccount).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('createInstallmentTransaction', () => {
    it('deve criar N parcelas ao criar lançamento parcelado', async () => {
      const installmentData: CreateTransactionInput = {
        description: 'Compra parcelada',
        amount: 1200,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-123',
        isRecurring: true,
        recurrenceData: {
          type: 'PARCELADA',
          totalInstallments: 12,
          firstDueDate: '2024-01-15T00:00:00.000Z',
        },
        tags: [],
      }

      const mockTransactions = Array.from({ length: 12 }, (_, i) => ({
        id: `installment-${i + 1}`,
        userId: mockUserId,
        description: `Compra parcelada ${i + 1}/12`,
        amount: 100,
        type: 'DESPESA',
        status: 'PENDENTE',
        dueDate: new Date(2024, 0, 15 + i),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      mockTransactionRepository.create.mockResolvedValue(mockTransactions[0])

      const result = await transactionService.createTransaction(mockUserId, installmentData)

      expect(mockTransactionRepository.create).toHaveBeenCalledTimes(12)
      expect(result).toEqual(mockTransactions[0])
    })
  })

  describe('createFixedTransaction', () => {
    it('deve criar lançamentos futuros ao criar lançamento fixo', async () => {
      const fixedData: CreateTransactionInput = {
        description: 'Assinatura mensal',
        amount: 50,
        type: 'DESPESA',
        status: 'PENDENTE',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-123',
        isRecurring: true,
        recurrenceData: {
          type: 'FIXA',
          frequency: 'MENSAL',
          endDate: '2024-06-15T00:00:00.000Z',
        },
        tags: [],
      }

      const mockTransaction = {
        id: 'fixed-123',
        userId: mockUserId,
        description: 'Assinatura mensal',
        amount: 50,
        type: 'DESPESA',
        status: 'PENDENTE',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTransactionRepository.create.mockResolvedValue(mockTransaction)

      const result = await transactionService.createTransaction(mockUserId, fixedData)

      // Deve criar 12 transações (6 meses x 2 transações: débito e crédito)
      expect(mockTransactionRepository.create).toHaveBeenCalledTimes(12)
      expect(result).toEqual(mockTransaction)
    })
  })

  describe('createTransfer', () => {
    it('deve criar dois lançamentos ao criar transferência (débito + crédito)', async () => {
      const transferData: CreateTransactionInput = {
        description: 'Transferência entre contas',
        amount: 500,
        type: 'TRANSFERENCIA',
        status: 'CONFIRMADO',
        regime: 'CAIXA',
        dueDate: '2024-01-15T00:00:00.000Z',
        accountId: 'account-origin',
        transferData: {
          destinationAccountId: 'account-destination',
        },
        isRecurring: false,
        tags: [],
      }

      const mockDebitTransaction = {
        id: 'debit-123',
        userId: mockUserId,
        description: 'Transferência para account-destination',
        amount: 500,
        type: 'DESPESA',
        status: 'CONFIRMADO',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockCreditTransaction = {
        id: 'credit-123',
        userId: mockUserId,
        description: 'Transferência de account-origin',
        amount: 500,
        type: 'RECEITA',
        status: 'CONFIRMADO',
        dueDate: new Date('2024-01-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTransactionRepository.create
        .mockResolvedValueOnce(mockDebitTransaction)
        .mockResolvedValueOnce(mockCreditTransaction)

      const result = await transactionService.createTransaction(mockUserId, transferData)

      expect(mockTransactionRepository.create).toHaveBeenCalledTimes(2)
      expect(result).toEqual(mockDebitTransaction)
    })
  })

  describe('updateTransaction', () => {
    it('deve atualizar transação existente', async () => {
      const transactionId = 'transaction-123'
      const updateData = {
        description: 'Updated Transaction',
        amount: 200,
      }

      const mockTransaction = {
        id: transactionId,
        userId: mockUserId,
        description: 'Updated Transaction',
        amount: 200,
        type: 'DESPESA',
        status: 'PENDENTE',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockTransactionRepository.exists.mockResolvedValue(true)
      mockTransactionRepository.update.mockResolvedValue(mockTransaction)

      const result = await transactionService.updateTransaction(
        mockUserId,
        transactionId,
        updateData
      )

      expect(result).toEqual(mockTransaction)
      expect(mockTransactionRepository.exists).toHaveBeenCalledWith(transactionId, mockUserId)
      expect(mockTransactionRepository.update).toHaveBeenCalledWith(transactionId, mockUserId, updateData)
    })

    it('deve rejeitar atualização de transação inexistente', async () => {
      const transactionId = 'non-existent'
      const updateData = { description: 'Updated' }

      mockTransactionRepository.exists.mockResolvedValue(false)

      await expect(
        transactionService.updateTransaction(mockUserId, transactionId, updateData)
      ).rejects.toThrow('Transação não encontrada')

      expect(mockTransactionRepository.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteTransaction', () => {
    it('deve excluir transação existente', async () => {
      const transactionId = 'transaction-123'

      mockTransactionRepository.exists.mockResolvedValue(true)
      mockTransactionRepository.delete.mockResolvedValue(undefined)

      await transactionService.deleteTransaction(mockUserId, transactionId)

      expect(mockTransactionRepository.exists).toHaveBeenCalledWith(transactionId, mockUserId)
      expect(mockTransactionRepository.delete).toHaveBeenCalledWith(transactionId, mockUserId)
    })

    it('deve rejeitar exclusão de transação inexistente', async () => {
      const transactionId = 'non-existent'

      mockTransactionRepository.exists.mockResolvedValue(false)

      await expect(
        transactionService.deleteTransaction(mockUserId, transactionId)
      ).rejects.toThrow('Transação não encontrada')

      expect(mockTransactionRepository.delete).not.toHaveBeenCalled()
    })
  })
})
