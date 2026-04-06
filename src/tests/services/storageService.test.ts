/**
 * CAMADA: Test - Service
 * MÓDULO: Storage Service
 * RESPONSABILIDADE: Testar regras de negócio de armazenamento
 */

import { StorageService } from '@/services/storageService'
import { UserRepository } from '@/repositories/userRepository'

// Mock dos repositórios
jest.mock('@/repositories/userRepository')

const mockUserRepository = {
  getUserPlan: jest.fn(),
  getStorageUsage: jest.fn()
} as any

describe('storageService', () => {
  let storageService: StorageService
  const mockUserId = 'user-123'

  beforeEach(() => {
    jest.resetAllMocks()
    storageService = new StorageService(mockUserRepository as any)
  })

  describe('getStorageUsage', () => {
    it('deve calcular uso corretamente para plano gratuito', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue({
        id: 'plan-gratuito',
        name: 'Gratuito',
        type: 'gratuito',
        transactionLimit: 50,
        userLimit: 1,
        storageLimitMb: 50
      })
      
      mockUserRepository.getStorageUsage.mockResolvedValue(25.5)

      const result = await storageService.getStorageUsage(mockUserId)

      expect(result).toEqual({
        usedMb: 25.5,
        limitMb: 50,
        availableMb: 24.5,
        usagePercent: 51
      })
    })

    it('deve retornar sem limite para admin', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue(null)
      mockUserRepository.getStorageUsage.mockResolvedValue(1000)

      const result = await storageService.getStorageUsage(mockUserId)

      expect(result.limitMb).toBe(Number.MAX_SAFE_INTEGER)
      expect(result.availableMb).toBe(Number.MAX_SAFE_INTEGER - 1000)
      expect(result.usagePercent).toBe(0)
    })
  })

  describe('canUpload', () => {
    it('deve permitir upload quando há espaço disponível', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue({
        storageLimitMb: 50
      })
      mockUserRepository.getStorageUsage.mockResolvedValue(25)

      const canUpload = await storageService.canUpload(mockUserId, 5 * 1024 * 1024) // 5MB

      expect(canUpload).toBe(true)
    })

    it('deve negar upload quando não há espaço', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue({
        storageLimitMb: 50
      })
      mockUserRepository.getStorageUsage.mockResolvedValue(48)

      const canUpload = await storageService.canUpload(mockUserId, 5 * 1024 * 1024) // 5MB

      expect(canUpload).toBe(false)
    })
  })

  describe('validateAttachmentUpload', () => {
    it('deve permitir upload de arquivo válido', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue({
        storageLimitMb: 50
      })
      mockUserRepository.getStorageUsage.mockResolvedValue(25)

      const result = await storageService.validateAttachmentUpload(
        mockUserId, 
        1024 * 1024, // 1MB
        'documento.pdf'
      )

      expect(result.allowed).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('deve negar arquivo muito grande', async () => {
      const result = await storageService.validateAttachmentUpload(
        mockUserId, 
        15 * 1024 * 1024, // 15MB
        'grande.pdf'
      )

      expect(result.allowed).toBe(false)
      expect(result.error).toBe('Arquivo muito grande. Tamanho máximo permitido: 10MB')
    })

    it('deve negar tipo de arquivo não permitido', async () => {
      const result = await storageService.validateAttachmentUpload(
        mockUserId, 
        1024 * 1024, // 1MB
        'executavel.exe'
      )

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Tipo de arquivo não permitido')
    })

    it('deve negar quando não há espaço', async () => {
      mockUserRepository.getUserPlan.mockResolvedValue({
        storageLimitMb: 50
      })
      mockUserRepository.getStorageUsage.mockResolvedValue(48)

      const result = await storageService.validateAttachmentUpload(
        mockUserId, 
        5 * 1024 * 1024, // 5MB
        'documento.pdf'
      )

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Espaço insuficiente')
    })
  })
})
