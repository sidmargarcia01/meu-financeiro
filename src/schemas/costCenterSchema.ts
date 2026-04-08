/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: Validação de entrada para centros de custo
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

export const createCostCenterSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  description: z.string()
    .max(255, 'Descrição deve ter no máximo 255 caracteres')
    .optional()
})

export const updateCostCenterSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100)
    .trim()
    .optional(),
  description: z.string()
    .max(255)
    .optional()
})

export type CreateCostCenterInput = z.infer<typeof createCostCenterSchema>
export type UpdateCostCenterInput = z.infer<typeof updateCostCenterSchema>
