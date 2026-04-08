/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: Validação de entrada para tags
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

export const createTagSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hex válido (ex: #FF0000)')
    .optional()
    .nullable()
})

export const updateTagSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50)
    .trim()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um código hex válido (ex: #FF0000)')
    .optional()
    .nullable()
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>
