/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Testar regras de negócio de categorias
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { categoryService } from '@/services/categoryService'
import { categoryRepository } from '@/repositories/categoryRepository'

jest.mock('@/repositories/categoryRepository')

describe('categoryService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar categoria raiz com type RECEITA', async () => {
      ;(categoryRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(categoryRepository.create as jest.Mock).mockResolvedValue({
        id: 'cat-1', name: 'Salário', type: 'RECEITA', parent_id: null, user_id: 'user-1'
      })

      const result = await categoryService.create('user-1', {
        name: 'Salário', type: 'RECEITA'
      })

      expect(result.type).toBe('RECEITA')
      expect(result.parent_id).toBeNull()
    })

    it('deve criar subcategoria herdando type do pai', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-pai', name: 'Habitação', type: 'DESPESA', parent_id: null
      })
      ;(categoryRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(categoryRepository.create as jest.Mock).mockResolvedValue({
        id: 'cat-sub', name: 'Aluguel', type: 'DESPESA', parent_id: 'cat-pai'
      })

      const result = await categoryService.create('user-1', {
        name: 'Aluguel', type: 'DESPESA', parent_id: 'cat-pai'
      })

      expect(result.parent_id).toBe('cat-pai')
    })

    it('deve rejeitar subcategoria com type diferente do pai', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-pai', name: 'Habitação', type: 'DESPESA', parent_id: null
      })

      await expect(
        categoryService.create('user-1', {
          name: 'Inválida', type: 'RECEITA', parent_id: 'cat-pai'
        })
      ).rejects.toThrow('Subcategoria deve ter o mesmo tipo da categoria pai')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(categoryRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'cat-existente', name: 'Alimentação'
      })

      await expect(
        categoryService.create('user-1', { name: 'Alimentação', type: 'DESPESA' })
      ).rejects.toThrow('Já existe uma categoria com este nome')
    })

    it('deve rejeitar subcategoria de subcategoria (máximo 2 níveis)', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-sub', name: 'Aluguel', type: 'DESPESA', parent_id: 'cat-pai'
      })

      await expect(
        categoryService.create('user-1', {
          name: 'Sub-sub', type: 'DESPESA', parent_id: 'cat-sub'
        })
      ).rejects.toThrow('Subcategorias não podem ter filhos')
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar categorias com filhos aninhados', async () => {
      ;(categoryRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Habitação', type: 'DESPESA', parent_id: null },
        { id: 'cat-2', name: 'Aluguel', type: 'DESPESA', parent_id: 'cat-1' },
        { id: 'cat-3', name: 'Salário', type: 'RECEITA', parent_id: null }
      ])

      const result = await categoryService.getAll('user-1')

      const habitacao = result.find(c => c.id === 'cat-1')
      expect(habitacao?.children).toHaveLength(1)
      expect(habitacao?.children[0].name).toBe('Aluguel')
    })

    it('deve filtrar por type quando informado', async () => {
      ;(categoryRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'cat-1', name: 'Habitação', type: 'DESPESA', parent_id: null }
      ])

      await categoryService.getAll('user-1', 'DESPESA')

      expect(categoryRepository.findAllByUser).toHaveBeenCalledWith(
        'user-1', expect.objectContaining({ type: 'DESPESA' })
      )
    })

    it('não deve retornar categorias de outro usuário', async () => {
      ;(categoryRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await categoryService.getAll('user-correto')

      expect(categoryRepository.findAllByUser).toHaveBeenCalledWith(
        'user-correto', {}
      )
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir categoria sem lançamentos vinculados', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-1', name: 'Lazer', type: 'DESPESA', user_id: 'user-1'
      })
      ;(categoryRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(categoryRepository.hasChildren as jest.Mock).mockResolvedValue(false)
      ;(categoryRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        categoryService.delete('cat-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-1', name: 'Alimentação', type: 'DESPESA', user_id: 'user-1'
      })
      ;(categoryRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        categoryService.delete('cat-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir categoria com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de categoria com subcategorias', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue({
        id: 'cat-1', name: 'Habitação', type: 'DESPESA', user_id: 'user-1'
      })
      ;(categoryRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(categoryRepository.hasChildren as jest.Mock).mockResolvedValue(true)

      await expect(
        categoryService.delete('cat-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir categoria com subcategorias')
    })

    it('deve rejeitar exclusão de categoria de outro usuário', async () => {
      ;(categoryRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        categoryService.delete('cat-1', 'user-correto')
      ).rejects.toThrow('Categoria não encontrada')
    })
  })
})
