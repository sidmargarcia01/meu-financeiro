/**
 * CAMADA: Model
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Definir tipos e schemas de validação para transações
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod
 */

import { z } from 'zod'

const civilDate = z.string().refine(value => {
  const day = value.slice(0, 10)
  const parsed = new Date(day + 'T00:00:00Z')
  return /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day
}, 'Data inválida')

// Schema para criação de transação
export const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.number().positive('Valor deve ser positivo'),
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']),
  // Aceita formato ISO date (YYYY-MM-DD) ou datetime completo
  dueDate: civilDate,
  paymentDate: civilDate.optional(),
  competenceDate: civilDate.optional(),
  regime: z.enum(['CAIXA', 'COMPETENCIA']).default('CAIXA'),
  accountId: z.string().uuid('ID da conta inválido').optional(),
  categoryId: z.string().uuid('ID da categoria inválido').optional(),
  centerId: z.string().uuid('ID do centro de custo inválido').optional(),
  projectId: z.string().uuid('ID do projeto inválido').optional(),
  contactId: z.string().uuid('ID do contato inválido').optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CONCILIADO']).default('PENDENTE'),
  isRecurring: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
  attachmentUrl: z.string().url().optional(),
  tags: z.array(z.string().uuid()).default([]),
  recurrenceData: z.discriminatedUnion('type', [
    z.object({ type: z.literal('PARCELADA'), totalInstallments: z.number().int().min(2).max(600), firstDueDate: civilDate }),
    z.object({ type: z.literal('FIXA'), frequency: z.enum(['SEMANAL','MENSAL','ANUAL']), months: z.number().int().min(1).max(600).optional(), endDate: civilDate.optional() }),
  ]).optional(),
  transferData: z.object({ destinationAccountId: z.string().uuid() }).optional(),
})

// Schema de criação com validação condicional: categoria obrigatória para RECEITA e DESPESA
export const createTransactionInputSchema = createTransactionSchema.superRefine((data, ctx) => {
  if (data.type === 'TRANSFERENCIA' && !data.transferData) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Conta de destino obrigatória', path: ['transferData'] })
  if (data.isRecurring && !data.recurrenceData) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Configuração da recorrência obrigatória', path: ['recurrenceData'] })
  if (data.type !== 'TRANSFERENCIA' && !data.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Categoria é obrigatória para receitas e despesas',
      path: ['categoryId'],
    })
  }
})

// Schema para atualização de transação
export const updateTransactionSchema = createTransactionSchema.partial().extend({
  categoryId: z.string().uuid().nullable().optional(), centerId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(), contactId: z.string().uuid().nullable().optional(),
  competenceDate: civilDate.nullable().optional(), notes: z.string().max(1000).nullable().optional(),
})

// Schema para filtros de transações
export const transactionFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: z.enum(['RECEITA', 'DESPESA', 'TRANSFERENCIA']).optional(),
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'CONCILIADO']).optional(),
  statuses: z.array(z.enum(['PENDENTE', 'CONFIRMADO', 'CONCILIADO'])).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  dateField: z.enum(['due_date', 'competence_date', 'payment_date']).optional(),
  search: z.string().optional(),
  tags: z.array(z.string().uuid()).optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(1000).optional(),
})

// Schema para parcelamento
export const installmentSchema = z.object({
  type: z.literal('PARCELADA'),
  totalInstallments: z.number().positive('Número de parcelas deve ser positivo'),
  firstDueDate: z.string().datetime('Data da primeira parcela inválida'),
})

// Schema para recorrência fixa
export const fixedRecurrenceSchema = z.object({
  type: z.literal('FIXA'),
  frequency: z.enum(['SEMANAL', 'MENSAL', 'ANUAL']),
  endDate: z.string().datetime().optional(),
})

// Types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>
export type InstallmentInput = z.infer<typeof installmentSchema>
export type FixedRecurrenceInput = z.infer<typeof fixedRecurrenceSchema>

// Interfaces para retorno de dados
export interface Transaction {
  transferGroupId?: string
  id: string
  userId: string
  accountId?: string
  categoryId?: string
  recurrenceId?: string
  centerId?: string
  projectId?: string
  contactId?: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
  dueDate: Date
  paymentDate?: Date
  competenceDate?: Date
  regime: 'CAIXA' | 'COMPETENCIA'
  isRecurring: boolean
  attachmentUrl?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface TransactionWithRelations extends Transaction {
  account?: {
    id: string
    name: string
    type: string
  }
  category?: {
    id: string
    name: string
    type: string
  }
  center?: {
    id: string
    name: string
    type: string
  }
  project?: {
    id: string
    name: string
    status: string
  }
  contact?: {
    id: string
    name: string
    type: string
  }
  tags?: Array<{
    id: string
    name: string
    color?: string
  }>
}

// Interface para saldo
export interface AccountBalance {
  accountId: string
  accountName: string
  projectedBalance: number
  confirmedBalance: number
}

// Interface para resumo mensal
export interface MonthlySummary {
  month: string
  totalIncome: number
  totalExpense: number
  netAmount: number
  transactionCount: number
}
