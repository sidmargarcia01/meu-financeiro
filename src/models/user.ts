/**
 * CAMADA: Model
 * MÓDULO: User
 * RESPONSABILIDADE: Definir tipos e schemas de validação para usuários
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod
 */

import { z } from 'zod'

// Schema para criação de usuário
export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  planId: z.string().uuid().optional(),
  defaultCurrency: z.string().length(3).default('BRL'),
})

// Schema para atualização de usuário
export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  planId: z.string().uuid().nullable().optional(),
  defaultCurrency: z.string().length(3).optional(),
})

// Schema para configurações do usuário
export const userSettingsSchema = z.object({
  enableCompetenceDate: z.boolean().default(false),
  requireCostCenter: z.boolean().default(false),
  requireProject: z.boolean().default(false),
  requireContact: z.boolean().default(false),
  requireTag: z.boolean().default(false),
  requireSubcategory: z.boolean().default(false),
  deletePasswordHash: z.string().optional(),
  installmentDefault: z.enum(['VALOR_PARCELA', 'VALOR_TOTAL']).default('VALOR_PARCELA'),
})

// Types
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type UserSettingsInput = z.infer<typeof userSettingsSchema>

// Interfaces para retorno de dados
export interface User {
  id: string
  email: string
  name: string
  planId?: string
  defaultCurrency: string
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  id: string
  userId: string
  enableCompetenceDate: boolean
  requireCostCenter: boolean
  requireProject: boolean
  requireContact: boolean
  requireTag: boolean
  requireSubcategory: boolean
  deletePasswordHash?: string
  installmentDefault: 'VALOR_PARCELA' | 'VALOR_TOTAL'
  updatedAt: Date
}

export interface UserWithSettings extends User {
  settings?: UserSettings
  plan?: {
    id: string
    name: string
    type: string
    transactionLimit: number
    userLimit: number
  }
}
