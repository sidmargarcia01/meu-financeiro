/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: Regras de negócio de formas de pagamento
 *   - Validação de nome obrigatório
 *   - Proibir nomes duplicados por usuário
 *   - Proibir exclusão com lançamentos vinculados
 *   - Validação de tipo de pagamento
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: paymentMethodRepository
 */

import { paymentMethodRepository } from '@/repositories/paymentMethodRepository'
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '@/schemas/paymentMethodSchema'

const validTypes = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'OTHER']

export const paymentMethodService = {
  async create(userId: string, input: CreatePaymentMethodInput) {
    // Validações de negócio
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório')
    }

    if (input.name.length > 50) {
      throw new Error('Nome deve ter no máximo 50 caracteres')
    }

    if (!validTypes.includes(input.type)) {
      throw new Error('Tipo de pagamento inválido')
    }

    // Verificar duplicidade
    const duplicado = await paymentMethodRepository.findByNameAndUser(input.name, userId)
    if (duplicado) {
      throw new Error('Já existe uma forma de pagamento com este nome')
    }

    return paymentMethodRepository.create(userId, input)
  },

  async getAll(userId: string) {
    return paymentMethodRepository.findAllByUser(userId)
  },

  async update(id: string, userId: string, input: UpdatePaymentMethodInput) {
    const existente = await paymentMethodRepository.findById(id, userId)
    if (!existente) throw new Error('Forma de pagamento não encontrada')

    if (input.name) {
      if (input.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (input.name.length > 50) {
        throw new Error('Nome deve ter no máximo 50 caracteres')
      }

      const duplicado = await paymentMethodRepository.findByNameAndUser(input.name, userId)
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe uma forma de pagamento com este nome')
      }
    }

    if (input.type && !validTypes.includes(input.type)) {
      throw new Error('Tipo de pagamento inválido')
    }

    return paymentMethodRepository.update(id, userId, input)
  },

  async delete(id: string, userId: string) {
    const existente = await paymentMethodRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Forma de pagamento não encontrada')

    // Verificar se há lançamentos vinculados
    const temLancamentos = await paymentMethodRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir forma de pagamento com lançamentos vinculados')
    }

    return paymentMethodRepository.delete(id, userId)
  }
}
