/**
 * CAMADA: Test - Service
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: Testar regras de negócio de formas de pagamento
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { paymentMethodService } from '@/services/paymentMethodService'
import { paymentMethodRepository } from '@/repositories/paymentMethodRepository'

jest.mock('@/repositories/paymentMethodRepository')

describe('paymentMethodService', () => {
  beforeEach(() => jest.clearAllMocks())

  // CREATE
  describe('create', () => {
    it('deve criar forma de pagamento com dados válidos', async () => {
      ;(paymentMethodRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(paymentMethodRepository.create as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão de Crédito', type: 'CREDIT_CARD', user_id: 'user-1'
      })

      const result = await paymentMethodService.create('user-1', {
        name: 'Cartão de Crédito',
        type: 'CREDIT_CARD'
      })

      expect(result.name).toBe('Cartão de Crédito')
      expect(result.type).toBe('CREDIT_CARD')
    })

    it('deve rejeitar nome duplicado no mesmo usuário', async () => {
      ;(paymentMethodRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'method-existente', name: 'Cartão de Crédito'
      })

      await expect(
        paymentMethodService.create('user-1', { name: 'Cartão de Crédito', type: 'CREDIT_CARD' })
      ).rejects.toThrow('Já existe uma forma de pagamento com este nome')
    })

    it('deve rejeitar nome vazio', async () => {
      await expect(
        paymentMethodService.create('user-1', { name: '', type: 'CREDIT_CARD' })
      ).rejects.toThrow('Nome é obrigatório')
    })

    it('deve rejeitar nome muito longo', async () => {
      await expect(
        paymentMethodService.create('user-1', { name: 'a'.repeat(51), type: 'CREDIT_CARD' })
      ).rejects.toThrow('Nome deve ter no máximo 50 caracteres')
    })

    it('deve rejeitar tipo inválido', async () => {
      await expect(
        paymentMethodService.create('user-1', { name: 'Teste', type: 'INVALID' })
      ).rejects.toThrow('Tipo de pagamento inválido')
    })
  })

  // GET ALL
  describe('getAll', () => {
    it('deve retornar formas de pagamento do usuário', async () => {
      ;(paymentMethodRepository.findAllByUser as jest.Mock).mockResolvedValue([
        { id: 'method-1', name: 'Cartão de Crédito', type: 'CREDIT_CARD', user_id: 'user-1' },
        { id: 'method-2', name: 'Dinheiro', type: 'CASH', user_id: 'user-1' }
      ])

      const result = await paymentMethodService.getAll('user-1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Cartão de Crédito')
    })

    it('não deve retornar formas de pagamento de outro usuário', async () => {
      ;(paymentMethodRepository.findAllByUser as jest.Mock).mockResolvedValue([])

      await paymentMethodService.getAll('user-correto')

      expect(paymentMethodRepository.findAllByUser).toHaveBeenCalledWith('user-correto')
    })
  })

  // UPDATE
  describe('update', () => {
    it('deve atualizar forma de pagamento com dados válidos', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão de Crédito', type: 'CREDIT_CARD', user_id: 'user-1'
      })
      ;(paymentMethodRepository.findByNameAndUser as jest.Mock).mockResolvedValue(null)
      ;(paymentMethodRepository.update as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão Visa', type: 'CREDIT_CARD', user_id: 'user-1'
      })

      const result = await paymentMethodService.update('method-1', 'user-1', {
        name: 'Cartão Visa'
      })

      expect(result.name).toBe('Cartão Visa')
    })

    it('deve rejeitar atualização de forma de pagamento não encontrada', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        paymentMethodService.update('method-inexistente', 'user-1', { name: 'Novo' })
      ).rejects.toThrow('Forma de pagamento não encontrada')
    })

    it('deve rejeitar nome duplicado na atualização', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão de Crédito', type: 'CREDIT_CARD', user_id: 'user-1'
      })
      ;(paymentMethodRepository.findByNameAndUser as jest.Mock).mockResolvedValue({
        id: 'method-2', name: 'Dinheiro' // Nome já existe
      })

      await expect(
        paymentMethodService.update('method-1', 'user-1', { name: 'Dinheiro' })
      ).rejects.toThrow('Já existe uma forma de pagamento com este nome')
    })
  })

  // DELETE
  describe('delete', () => {
    it('deve excluir forma de pagamento sem lançamentos vinculados', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão de Crédito', user_id: 'user-1'
      })
      ;(paymentMethodRepository.hasTransactions as jest.Mock).mockResolvedValue(false)
      ;(paymentMethodRepository.delete as jest.Mock).mockResolvedValue(true)

      await expect(
        paymentMethodService.delete('method-1', 'user-1')
      ).resolves.not.toThrow()
    })

    it('deve rejeitar exclusão com lançamentos vinculados', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue({
        id: 'method-1', name: 'Cartão de Crédito', user_id: 'user-1'
      })
      ;(paymentMethodRepository.hasTransactions as jest.Mock).mockResolvedValue(true)

      await expect(
        paymentMethodService.delete('method-1', 'user-1')
      ).rejects.toThrow('Não é possível excluir forma de pagamento com lançamentos vinculados')
    })

    it('deve rejeitar exclusão de forma de pagamento de outro usuário', async () => {
      ;(paymentMethodRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(
        paymentMethodService.delete('method-1', 'user-correto')
      ).rejects.toThrow('Forma de pagamento não encontrada')
    })
  })
})
