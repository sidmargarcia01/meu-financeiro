/**
 * CAMADA: Service
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: Regras de negócio de contatos
 *   - Validação de nome obrigatório
 *   - Proibir nomes duplicados por usuário
 *   - Proibir exclusão com lançamentos vinculados
 *   - Validação de formato de email e telefone
 * NÃO DEVE: Acessar banco diretamente, importar Prisma ou Supabase
 * DEPENDE DE: contactRepository
 */

import { contactRepository } from '@/repositories/contactRepository'
import type { CreateContactInput, UpdateContactInput } from '@/schemas/contactSchema'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const contactService = {
  async create(userId: string, input: CreateContactInput) {
    // Validações de negócio
    if (!input.name || input.name.trim().length === 0) {
      throw new Error('Nome é obrigatório')
    }

    if (input.name.length > 100) {
      throw new Error('Nome deve ter no máximo 100 caracteres')
    }

    // Validar email se fornecido
    if (input.email && !emailRegex.test(input.email)) {
      throw new Error('Email inválido')
    }

    // Validar telefone se fornecido
    if (input.phone && (input.phone.length < 10 || input.phone.length > 15)) {
      throw new Error('Telefone deve ter entre 10 e 15 dígitos')
    }

    // Verificar duplicidade
    const duplicado = await contactRepository.findByNameAndUser(input.name, userId)
    if (duplicado) {
      throw new Error('Já existe um contato com este nome')
    }

    return contactRepository.create(userId, input)
  },

  async getAll(userId: string) {
    return contactRepository.findAllByUser(userId)
  },

  async update(id: string, userId: string, input: UpdateContactInput) {
    const existente = await contactRepository.findById(id, userId)
    if (!existente) throw new Error('Contato não encontrado')

    if (input.name) {
      if (input.name.trim().length === 0) {
        throw new Error('Nome é obrigatório')
      }

      if (input.name.length > 100) {
        throw new Error('Nome deve ter no máximo 100 caracteres')
      }

      const duplicado = await contactRepository.findByNameAndUser(input.name, userId)
      if (duplicado && duplicado.id !== id) {
        throw new Error('Já existe um contato com este nome')
      }
    }

    // Validar email se fornecido
    if (input.email && input.email && !emailRegex.test(input.email)) {
      throw new Error('Email inválido')
    }

    // Validar telefone se fornecido
    if (input.phone && (input.phone.length < 10 || input.phone.length > 15)) {
      throw new Error('Telefone deve ter entre 10 e 15 dígitos')
    }

    return contactRepository.update(id, userId, input)
  },

  async delete(id: string, userId: string) {
    const existente = await contactRepository.findById(id, userId)

    // RLS garante isolamento, mas verificamos explicitamente
    if (!existente) throw new Error('Contato não encontrado')

    // Verificar se há lançamentos vinculados
    const temLancamentos = await contactRepository.hasTransactions(id, userId)
    if (temLancamentos) {
      throw new Error('Não é possível excluir contato com lançamentos vinculados')
    }

    return contactRepository.delete(id, userId)
  }
}
