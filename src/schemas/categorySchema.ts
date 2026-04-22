/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Validação de entrada para categorias
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

export const DRE_GROUPS = [
  'RECEITA_BRUTA',
  'DEDUCAO_RECEITA',
  'CPV',
  'DESPESA_OPERACIONAL',
  'DESPESA_FINANCEIRA',
  'OUTRAS_RECEITAS',
  'OUTRAS_DESPESAS',
] as const

export type DreGroup = typeof DRE_GROUPS[number]

export const DRE_GROUP_LABELS: Record<DreGroup, string> = {
  RECEITA_BRUTA: 'Receita Bruta',
  DEDUCAO_RECEITA: 'Deduções de Receita',
  CPV: 'CPV / CSV',
  DESPESA_OPERACIONAL: 'Despesa Operacional',
  DESPESA_FINANCEIRA: 'Despesa Financeira',
  OUTRAS_RECEITAS: 'Outras Receitas',
  OUTRAS_DESPESAS: 'Outras Despesas',
}

export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  type: z.enum(['RECEITA', 'DESPESA'], {
    errorMap: () => ({ message: 'Tipo deve ser RECEITA ou DESPESA' })
  }),
  parent_id: z.string().optional().nullable(),
  dre_group: z.enum(DRE_GROUPS).optional().nullable(),
})

export const updateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100)
    .trim()
    .optional(),
  // type não pode ser alterado após criação para preservar integridade
  dre_group: z.enum(DRE_GROUPS).optional().nullable(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
