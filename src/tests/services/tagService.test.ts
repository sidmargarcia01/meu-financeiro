/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: Testar regras de negócio de tags
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { tagService } from '@/services/tagService'
import { tagRepository } from '@/repositories/tagRepository'

jest.mock('@/repositories/tagRepository')

describe('tagService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar tag com dados válidos', async () => {
      ;(tagRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(tagRepository.create as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente', color: '#ff0000', user_id: 'user-1'
      })

      const result = await tagService.create('user-1', {
        name: 'urgente',
        color: '#ff0000'
      })

      expect(result.name).toBe('urgente')
      expect(result.color).toBe('#ff0000')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(tagRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'tag-existente', name: 'urgente'
      })

      await expect(
        tagService.create('user-1', { name: 'urgente', color: '#ff0000' })
      ).rejects.toThrow('Já existe uma tag com este nome')
    })

    it('deve rejeitar nome vazio', async () => {
      await expect(
        tagService.create('user-1', { name: '', color: '#ff0000' })
      ).rejects.toThrow('Nome é obrigatório')
    })

    it('deve rejeitar nome muito longo', async () => {
      await expect(
        tagService.create('user-1', { name: 'a'.repeat(51), color: '#ff0000' })
      ).rejects.toThrow('Nome deve ter no máximo 50 caracteres')
    })

    it('deve aceitar cor opcional', async () => {
      ;(tagRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(tagRepository.create as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'trabalho', color: null, user_id: 'user-1'
      })

      const result = await tagService.create('user-1', {
        name: 'trabalho'
      })

      expect(result.name).toBe('trabalho')
      expect(result.color).toBeNull()
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar tags do usuário', async () => {
      ;(tagRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'tag-1', name: 'urgente', color: '#ff0000', user_id: 'user-1' },
        { id: 'tag-2', name: 'trabalho', color: '#00ff00', user_id: 'user-1' }
      ])

      const result = await tagService.getAll('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('urgente')
    })

    it('não deve retornar tags de outro usuário', async () => {
      ;(tagRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await tagService.getAll('user-correto')

      expect(tagRepository.findAllByUser).toHaveBeenCalledWith('user-correto')
    })
  })

  // UPDATE
  describe('update', () => {
    it('deve atualizar tag com dados válidos', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente', color: '#ff0000', user_id: 'user-1'
      })
      ;(tagRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(tagRepository.update as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente-atualizado', color: '#0000ff', user_id: 'user-1'
      })

      const result = await tagService.update('tag-1', 'user-1', {
        name: 'urgente-atualizado',
        color: '#0000ff'
      })

      expect(result.name).toBe('urgente-atualizado')
    })

    it('deve rejeitar atualização de tag não encontrada', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        tagService.update('tag-inexistente', 'user-1', { name: 'novo' })
      ).rejects.toThrow('Tag não encontrada')
    })

    it('deve rejeitar nome duplicado na atualização', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente', color: '#ff0000', user_id: 'user-1'
      })
      ;(tagRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'tag-2', name: 'trabalho' // Nome já existe
      })

      await expect(
        tagService.update('tag-1', 'user-1', { name: 'trabalho' })
      ).rejects.toThrow('Já existe uma tag com este nome')
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir tag sem lançamentos vinculados', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente', user_id: 'user-1'
      })
      ;(tagRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(tagRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        tagService.delete('tag-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue({
        id: 'tag-1', name: 'urgente', user_id: 'user-1'
      })
      ;(tagRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        tagService.delete('tag-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir tag com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de tag de outro usuário', async () => {
      ;(tagRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        tagService.delete('tag-1', 'user-correto')
      ).rejects.toThrow('Tag não encontrada')
    })
  })
})
