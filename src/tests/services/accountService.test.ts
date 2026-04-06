/**
 * CAMADA: Test - Service
 * MÓDULO: Account Service
 * RESPONSABILIDADE: Testar regras de negócio das contas
 */

import { AccountService } from '@/services/accountService'
import { AccountRepository } from '@/repositories/accountRepository'
import { TransactionRepository } from '@/repositories/transactionRepository'
import { UserRepository } from '@/repositories/userRepository'

// Mock dos repositórios
jest.mock('@/repositories/accountRepository')
jest.mock('@/repositories/transactionRepository')
jest.mock('@/repositories/userRepository')

const mockAccountRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  list: jest.fn(),
  listWithBalances: jest.fn(),
  findByType: jest.fn(),
  count: jest.fn(),
  exists: jest.fn(),
  hasTransactions: jest.fn(),
  findAllByUser: jest.fn(),
  createCreditCard: jest.fn(),
  findCreditCardById: jest.fn(),
  updateCreditCard: jest.fn(),
  deleteCreditCard: jest.fn(),
  findCreditCardByAccountId: jest.fn()
} as any

const mockTransactionRepository = {
  sumByAccount: jest.fn()
} as any

const mockUserRepository = {
  getUserPlan: jest.fn()
} as any

describe('accountService', () => {
  let accountService: AccountService
  const mockUserId = 'user-123'
  const mockAccountId = 'account-123'

  beforeEach(() => {
    jest.resetAllMocks()
    accountService = new AccountService(mockAccountRepository as any, mockTransactionRepository as any, mockUserRepository as any)
  })

  describe('calculateBalance', () => {
    it('deve calcular saldo projetado somando PENDENTE + CONFIRMADO + CONCILIADO', async () => {
      mockAccountRepository.findById.mockResolvedValue({
        id: mockAccountId,
        userId: mockUserId,
        initialBalance: 1000.00
      })
      
      mockTransactionRepository.sumByAccount
        .mockImplementation((accountId, statusFilter) => {
          if (statusFilter.includes('PENDENTE')) return Promise.resolve(500.00)
          return Promise.resolve(300.00)
        })

      const result = await accountService.calculateBalance(mockAccountId, mockUserId)

      expect(result.projected).toBe(1500.00) // 1000 + 500
      expect(result.confirmed).toBe(1300.00) // 1000 + 300
    })

    it('deve retornar saldo negativo quando despesas superam receitas', async () => {
      mockAccountRepository.findById.mockResolvedValue({
        id: mockAccountId,
        userId: mockUserId,
        initialBalance: 0
      })
      
      mockTransactionRepository.sumByAccount.mockResolvedValue(-500.00)

      const result = await accountService.calculateBalance(mockAccountId, mockUserId)
      
      expect(result.projected).toBe(-500.00)
      expect(result.confirmed).toBe(-500.00)
    })

    it('deve lançar erro quando conta não existe ou não pertence ao usuário', async () => {
      mockAccountRepository.findById.mockResolvedValue(null)

      await expect(
        accountService.calculateBalance('id-inexistente', mockUserId)
      ).rejects.toThrow('Conta não encontrada')
    })
  })
})
