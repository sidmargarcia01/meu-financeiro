/**
 * CAMADA: Model
 * MÓDULO: Account
 * RESPONSABILIDADE: Definir tipos e schemas de validação para contas
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod
 */

import { z } from 'zod'

// Schema para criação de conta
export const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório').max(100),
  type: z.enum(['CORRENTE', 'POUPANCA', 'INVESTIMENTO', 'CARTAO', 'CARTEIRA']),
  initialBalance: z.number().default(0),
  currency: z.string().length(3).default('BRL'),
  icon: z.string().optional(),
  bankConnectionId: z.string().optional(),
})

// Schema para atualização de conta
export const updateAccountSchema = createAccountSchema.partial().extend({
  isActive: z.boolean().optional(),
})

// Schema para cartão de crédito
export const createCreditCardSchema = z.object({
  accountId: z.string().uuid('ID da conta inválido'),
  creditLimit: z.number().positive('Limite deve ser positivo').optional(),
  closingDay: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
  dueDay: z.number().min(1).max(31, 'Dia deve estar entre 1 e 31'),
})

// Types
export type CreateAccountInput = z.infer<typeof createAccountSchema> & {
  initialBalance: number
  currency: string
}
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>
export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>

// Interfaces para retorno de dados
export interface Account {
  id: string
  userId: string
  name: string
  type: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
  initialBalance: number
  currency: string
  icon?: string
  isActive: boolean
  bankConnectionId?: string
  createdAt: Date
}

export interface AccountWithBalance extends Account {
  currentBalance: number
  projectedBalance: number
  confirmedBalance: number
}

export interface CreditCard {
  id: string
  accountId: string
  creditLimit?: number
  closingDay?: number
  dueDay?: number
  createdAt: Date
}

export interface AccountWithCreditCard extends Account {
  creditCard?: CreditCard
}
