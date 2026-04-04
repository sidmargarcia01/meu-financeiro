/**
 * CAMADA: Test
 * MÓDULO: Plan Service
 * RESPONSABILIDADE: Testes unitários do serviço de planos
 * NÃO DEVE: Acessar banco de dados real ou dependências externas
 * DEPENDE DE: Jest, mocks
 */

import { PlanService } from '@/services/planService'
import { UserRepository } from '@/repositories/userRepository'
import { TransactionRepository } from '@/repositories/transactionRepository'

// Mock dos repositórios
jest.mock('@/repositories/userRepository')
jest.mock('@/repositories/transactionRepository')

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

describe('planService', () => {
  let planService: PlanService
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.resetAllMocks()
    planService = new PlanService(mockUserRepository as any, mockTransactionRepository as any)
    
    // Mock padrão para getUserPlan
    mockUserRepository.getUserPlan.mockResolvedValue({
      id: 'plan-id',
      name: 'Pessoal',
      type: 'pessoal',
      transactionLimit: 250,
      userLimit: 0,
      storageLimitMb: 50,
      features: {
        reports: true,
        investments: false,
        exports: true
      }
    })
    
    // Mock padrão para getStorageUsage
    mockUserRepository.getStorageUsage.mockResolvedValue(10 * 1024 * 1024) // 10MB
    
    // Mock padrão para findById
    mockUserRepository.findById.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      planId: 'plan-id',
      defaultCurrency: 'BRL',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // Mock padrão para countTransactionsThisMonth
    mockUserRepository.countTransactionsThisMonth.mockResolvedValue(50)
  })

  describe('Verificação de Limites', () => {
    it('deve bloquear criação quando limite mensal for atingido', async () => {
      // Mock de plano gratuito (100 transações/mês)
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(100)
      mockUserRepository.getUserPlan.mockResolvedValue({
        id: 'plan-free',
        name: 'Gratuito',
        type: 'pessoal',
        transactionLimit: 100,
        userLimit: 0,
        storageLimitMb: 0,
        features: {},
      })

      const canCreate = await planService.canCreateTransaction(mockUserId)

      expect(canCreate).toBe(false)
      expect(mockUserRepository.countTransactionsThisMonth).toHaveBeenCalledWith(mockUserId)
    })

    it('deve permitir criação quando abaixo do limite', async () => {
      // Usando plano padrão do beforeEach (limite 250)
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(50)

      const canCreate = await planService.canCreateTransaction(mockUserId)

      expect(canCreate).toBe(true)
    })

    it('deve bloquear upload quando limite de storage for atingido', async () => {
      // Mock de usuário com 50MB usados em plano com limite de 50MB
      mockUserRepository.getStorageUsage.mockResolvedValue(50 * 1024 * 1024) // 50MB em bytes
      mockUserRepository.getUserPlan.mockResolvedValue({
        id: 'plan-personal',
        name: 'Pessoal',
        type: 'pessoal',
        transactionLimit: 250,
        userLimit: 0,
        storageLimitMb: 50,
        features: {},
      })

      const canUpload = await planService.canUploadFile(mockUserId, 10 * 1024 * 1024) // 10MB

      expect(canUpload).toBe(false)
    })
  })

  describe('Cálculo de Usage', () => {
    it('deve calcular uso percentual corretamente', async () => {
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(75)

      const usage = await planService.getUsage(mockUserId)

      expect(usage.transactions.used).toBe(75)
      expect(usage.transactions.limit).toBe(250)
      expect(usage.transactions.percentage).toBe(30) // 75/250 * 100
    })

    it('deve lidar com plano sem limite (ilimitado)', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue(null) // Sem plano = ilimitado
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(1) // 1 transação

      const usage = await planService.getUsage(mockUserId)

      expect(usage.transactions.used).toBe(1)
      expect(usage.transactions.limit).toBe(100) // Default
      expect(usage.transactions.percentage).toBe(1) // 1/100 = 1%
    })
  })

  describe('Validação de Features', () => {
    it('deve verificar se usuário tem acesso a features específicas', async () => {
      const hasReports = await planService.hasFeature(mockUserId, 'reports')
      const hasInvestments = await planService.hasFeature(mockUserId, 'investments')

      expect(hasReports).toBe(true)
      expect(hasInvestments).toBe(false)
    })

    it('deve retornar false para feature não existente', async () => {
      const hasFeature = await planService.hasFeature(mockUserId, 'nonexistent')

      expect(hasFeature).toBe(false)
    })

    it('deve retornar true para todas features quando usuário não tem plano (admin)', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue(null)

      const hasFeature = await planService.hasFeature(mockUserId, 'any-feature')

      expect(hasFeature).toBe(true)
    })
  })

  describe('Upgrade de Plano', () => {
    it('deve permitir upgrade de plano', async () => {
      const newPlanId = 'plan-professional'

      await planService.upgradePlan(mockUserId, newPlanId)

      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUserId, {
        planId: newPlanId,
      })
    })

    it('deve bloquear downgrade se tiver dados que excedem limite', async () => {
      // Mock para simular usuário com 300 transações (excedendo limite de 100)
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(300)
      mockUserRepository.getStorageUsage.mockResolvedValue(10 * 1024 * 1024) // 10MB

      const targetPlan = {
        id: 'plan-free',
        name: 'Gratuito',
        type: 'pessoal',
        transactionLimit: 100,
        userLimit: 0,
        storageLimitMb: 0,
        features: {},
      }

      await expect(
        planService.canDowngradeToPlan(mockUserId, targetPlan)
      ).rejects.toThrow('Não é possível fazer downgrade: você tem 300 transações este mês, mas o plano Gratuito permite apenas 100')

      expect(mockUserRepository.countTransactionsThisMonth).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('Alertas', () => {
    it('deve gerar alerta quando próximo do limite', async () => {
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(225) // 90% de 250
      // Usando o plano padrão do beforeEach com limite de 250

      const alerts = await planService.getAlerts(mockUserId)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('warning')
      expect(alerts[0].message).toContain('90%')
      expect(alerts[0].message).toContain('limite de transações')
    })

    it('deve gerar alerta crítico quando limite excedido', async () => {
      mockUserRepository.countTransactionsThisMonth.mockResolvedValue(300) // Excedeu 250

      const alerts = await planService.getAlerts(mockUserId)

      expect(alerts).toHaveLength(1)
      expect(alerts[0].type).toBe('error')
      expect(alerts[0].message).toContain('excedeu')
    })
  })
})
