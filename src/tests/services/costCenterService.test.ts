/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: Testar regras de negócio de centros de custo
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { costCenterService } from '@/services/costCenterService'
import { costCenterRepository } from '@/repositories/costCenterRepository'

jest.mock('@/repositories/costCenterRepository')

describe('costCenterService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar centro de custo com dados válidos', async () => {
      ;(costCenterRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(costCenterRepository.create as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing', description: 'Setor de marketing', user_id: 'user-1'
      })

      const result = await costCenterService.create('user-1', {
        name: 'Marketing',
        description: 'Setor de marketing'
      })

      expect(result.name).toBe('Marketing')
      expect(result.description).toBe('Setor de marketing')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(costCenterRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'center-existente', name: 'Marketing'
      })

      await expect(
        costCenterService.create('user-1', { name: 'Marketing', description: 'Duplicado' })
      ).rejects.toThrow('Já existe um centro de custo com este nome')
    })

    it('deve rejeitar nome vazio', async () => {
      await expect(
        costCenterService.create('user-1', { name: '', description: 'Inválido' })
      ).rejects.toThrow('Nome é obrigatório')
    })

    it('deve rejeitar nome muito longo', async () => {
      await expect(
        costCenterService.create('user-1', { name: 'a'.repeat(101), description: 'Inválido' })
      ).rejects.toThrow('Nome deve ter no máximo 100 caracteres')
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar centros de custo do usuário', async () => {
      ;(costCenterRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'center-1', name: 'Marketing', description: 'Marketing', user_id: 'user-1' },
        { id: 'center-2', name: 'Vendas', description: 'Vendas', user_id: 'user-1' }
      ])

      const result = await costCenterService.getAll('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Marketing')
    })

    it('não deve retornar centros de custo de outro usuário', async () => {
      ;(costCenterRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await costCenterService.getAll('user-correto')

      expect(costCenterRepository.findAllByUser).toHaveBeenCalledWith('user-correto')
    })
  })

  // UPDATE
  describe('update', () => {
    it('deve atualizar centro de custo com dados válidos', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing', description: 'Antigo', user_id: 'user-1'
      })
      ;(costCenterRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(costCenterRepository.update as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing Atualizado', description: 'Novo', user_id: 'user-1'
      })

      const result = await costCenterService.update('center-1', 'user-1', {
        name: 'Marketing Atualizado',
        description: 'Novo'
      })

      expect(result.name).toBe('Marketing Atualizado')
    })

    it('deve rejeitar atualização de centro de custo não encontrado', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        costCenterService.update('center-inexistente', 'user-1', { name: 'Novo' })
      ).rejects.toThrow('Centro de custo não encontrado')
    })

    it('deve rejeitar nome duplicado na atualização', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing', description: 'Original', user_id: 'user-1'
      })
      ;(costCenterRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'center-2', name: 'Vendas' // Nome já existe
      })

      await expect(
        costCenterService.update('center-1', 'user-1', { name: 'Vendas' })
      ).rejects.toThrow('Já existe um centro de custo com este nome')
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir centro de custo sem lançamentos vinculados', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing', user_id: 'user-1'
      })
      ;(costCenterRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(costCenterRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        costCenterService.delete('center-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue({
        id: 'center-1', name: 'Marketing', user_id: 'user-1'
      })
      ;(costCenterRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        costCenterService.delete('center-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir centro de custo com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de centro de custo de outro usuário', async () => {
      ;(costCenterRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        costCenterService.delete('center-1', 'user-correto')
      ).rejects.toThrow('Centro de custo não encontrado')
    })
  })
})
