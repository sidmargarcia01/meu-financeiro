/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: Regras de negócio de tags
 *   - Validação de nome obrigatório
 *   - Proibir nomes duplicados por usuário
 *   - Proibir exclusão com lançamentos vinculados
 *   - Validação de formato de cor (hex)
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: tagRepository
 */

import { tagRepository } from '@/repositories/tagRepository'
import type { CreateTagInput, UpdateTagInput } from '@/schemas/tagSchema'

export const tagService = {
  async create(userId: string, input: CreateTagInput) {
    // Validações de negócio
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório')
    }

    if (input.name.length > 50) {
      throw new Error('Nome deve ter no máximo 50 caracteres')
    }

    // Validar formato da cor se fornecida
    if (input.color && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new Error('Cor deve ser um código hex válido (ex: #FF0000)')
    }

    // Verificar duplicidade
    const duplicado = await tagRepository.findByNameAndUser(input.name, userId)
    if (duplicado) {
      throw new Error('Já existe uma tag com este nome')
    }

    return tagRepository.create(userId, input)
  },

  async getAll(userId: string) {
    return tagRepository.findAllByUser(userId)
  },

  async update(id: string, userId: string, input: UpdateTagInput) {
    const existente = await tagRepository.findById(id, userId)
    if (!existente) throw new Error('Tag não encontrada')

    if (input.name) {
      if (input.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (input.name.length > 50) {
        throw new Error('Nome deve ter no máximo 50 caracteres')
      }

      const duplicado = await tagRepository.findByNameAndUser(input.name, userId)
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe uma tag com este nome')
      }
    }

    // Validar formato da cor se fornecida
    if (input.color && !/^#[0-9A-Fa-f]{6}$/.test(input.color)) {
      throw new Error('Cor deve ser um código hex válido (ex: #FF0000)')
    }

    return tagRepository.update(id, userId, input)
  },

  async delete(id: string, userId: string) {
    const existente = await tagRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Tag não encontrada')

    // Verificar se há lançamentos vinculados
    const temLancamentos = await tagRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir tag com lançamentos vinculados')
    }

    return tagRepository.delete(id, userId)
  }
}
