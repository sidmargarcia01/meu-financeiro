/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Validação de entrada para categorias
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  type: z.enum(['RECEITA', 'DESPESA'], {
    errorMap: () => ({ message: 'Tipo deve ser RECEITA ou DESPESA' })
  }),
  parent_id: z.string().uuid('ID de categoria pai inválido').optional().nullable()
})

export const updateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100)
    .trim()
    .optional(),
  // type não pode ser alterado após criação para preservar integridade
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
