/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Validação de entrada para categorias
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

// 10 grupos DRE gerencial — alinhado com personal-website (indicators-report.service)
export const DRE_GROUPS = [
  'RECEITAS_OPERACIONAIS',     // ROB → Receita Líquida
  'IMPOSTOS_FATURAMENTO',      // (-) Impostos sobre faturamento
  'CUSTOS_OPERACIONAIS',       // (-) CPV / CSV → Margem Bruta
  'DESPESAS_VARIAVEIS',        // (-) Variáveis → Margem de Contribuição
  'DESPESAS_FIXAS',            // (-) Fixas → EBITDA
  'INVESTIMENTOS',             // (-) Investimentos → Lucro Operacional
  'RECEITAS_NAO_OPERACIONAIS', // (+) Outras receitas
  'DESPESAS_NAO_OPERACIONAIS', // (-) Outras despesas → EBT
  'IMPOSTOS_LUCRO',            // (-) IR / CSLL
  'DISTRIBUICAO_LUCROS',       // (-) Dividendos → Resultado Líquido
] as const

export type DreGroup = typeof DRE_GROUPS[number]

export const DRE_GROUP_LABELS: Record<DreGroup, string> = {
  RECEITAS_OPERACIONAIS: 'Receitas Operacionais',
  IMPOSTOS_FATURAMENTO: 'Impostos sobre Faturamento',
  CUSTOS_OPERACIONAIS: 'Custos Operacionais (CPV/CSV)',
  DESPESAS_VARIAVEIS: 'Despesas Variáveis',
  DESPESAS_FIXAS: 'Despesas Fixas',
  INVESTIMENTOS: 'Investimentos',
  RECEITAS_NAO_OPERACIONAIS: 'Receitas Não Operacionais',
  DESPESAS_NAO_OPERACIONAIS: 'Despesas Não Operacionais',
  IMPOSTOS_LUCRO: 'Impostos sobre Lucros (IR/CSLL)',
  DISTRIBUICAO_LUCROS: 'Distribuição de Lucros',
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
