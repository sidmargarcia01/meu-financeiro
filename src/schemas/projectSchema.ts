/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Projetos
 * RESPONSABILIDADE: Validação de entrada para projetos
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional()
})

export const updateProjectSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100)
    .trim()
    .optional(),
  description: z.string()
    .max(255)
    .optional()
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
