/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: Regras de negócio de centros de custo
 *   - Validação de nome obrigatório
 *   - Proibir nomes duplicados por usuário
 *   - Proibir exclusão com lançamentos vinculados
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: costCenterRepository
 */

import { costCenterRepository } from '@/repositories/costCenterRepository'
import type { CreateCostCenterInput, UpdateCostCenterInput } from '@/schemas/costCenterSchema'

export const costCenterService = {
  async create(userId: string, input: CreateCostCenterInput) {
    // Validações de negócio
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório')
    }

    if (input.name.length > 100) {
      throw new Error('Nome deve ter no máximo 100 caracteres')
    }

    // Verificar duplicidade
    const duplicado = await costCenterRepository.findByNameAndUser(input.name, userId)
    if (duplicado) {
      throw new Error('Já existe um centro de custo com este nome')
    }

    return costCenterRepository.create(userId, input)
  },

  async getAll(userId: string) {
    return costCenterRepository.findAllByUser(userId)
  },

  async update(id: string, userId: string, input: UpdateCostCenterInput) {
    const existente = await costCenterRepository.findById(id, userId)
    if (!existente) throw new Error('Centro de custo não encontrado')

    if (input.name) {
      if (input.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (input.name.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres')
      }

      const duplicado = await costCenterRepository.findByNameAndUser(input.name, userId)
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe um centro de custo com este nome')
      }
    }

    return costCenterRepository.update(id, userId, input)
  },

  async delete(id: string, userId: string) {
    const existente = await costCenterRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Centro de custo não encontrado')

    // Verificar se há lançamentos vinculados
    const temLancamentos = await costCenterRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir centro de custo com lançamentos vinculados')
    }

    return costCenterRepository.delete(id, userId)
  }
}
