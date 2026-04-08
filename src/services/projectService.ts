/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Projetos
 * RESPONSABILIDADE: Regras de negócio de projetos
 *   - Validação de nome obrigatório
 *   - Proibir nomes duplicados por usuário
 *   - Proibir exclusão com lançamentos vinculados
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: projectRepository
 */

import { projectRepository } from '@/repositories/projectRepository'
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/projectSchema'

export const projectService = {
  async create(userId: string, input: CreateProjectInput) {
    // Validações de negócio
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório')
    }

    if (input.name.length > 100) {
      throw new Error('Nome deve ter no máximo 100 caracteres')
    }

    // Verificar duplicidade
    const duplicado = await projectRepository.findByNameAndUser(input.name, userId)
    if (duplicado) {
      throw new Error('Já existe um projeto com este nome')
    }

    return projectRepository.create(userId, input)
  },

  async getAll(userId: string) {
    return projectRepository.findAllByUser(userId)
  },

  async update(id: string, userId: string, input: UpdateProjectInput) {
    const existente = await projectRepository.findById(id, userId)
    if (!existente) throw new Error('Projeto não encontrado')

    if (input.name) {
      if (input.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (input.name.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres')
      }

      const duplicado = await projectRepository.findByNameAndUser(input.name, userId)
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe um projeto com este nome')
      }
    }

    return projectRepository.update(id, userId, input)
  },

  async delete(id: string, userId: string) {
    const existente = await projectRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Projeto não encontrado')

    // Verificar se há lançamentos vinculados
    const temLancamentos = await projectRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir projeto com lançamentos vinculados')
    }

    return projectRepository.delete(id, userId)
  }
}
