/**
 * CAMADA: Model
 * MÓDULO: Common
 * RESPONSABILIDADE: Definir tipos e schemas comuns a múltiplos módulos
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod
 */

import { z } from 'zod'

// Schema para paginação
export const paginationSchema = z.object({
  page: z.number().positive().default(1),
  limit: z.number().positive().max(100).default(20),
  cursor: z.string().optional(),
})

// Schema para resposta paginada
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Schema para resposta de API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Schema para erro de API
export interface ApiError {
  code: string
  message: string
  details?: any
}

// Types comuns
export type PaginationParams = z.infer<typeof paginationSchema>
export type Currency = 'BRL' | 'USD' | 'EUR'
export type TransactionType = 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
export type TransactionStatus = 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
export type AccountType = 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
export type CategoryType = 'RECEITA' | 'DESPESA'
export type Regime = 'CAIXA' | 'COMPETENCIA'

// Interface para usuário autenticado
export interface AuthUser {
  id: string
  email: string
  name?: string
  planId?: string
}

// Interface para contexto de requisição
export interface RequestContext {
  user: AuthUser
  ip?: string
  userAgent?: string
}

// Interface para logs estruturados
export interface LogContext {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  ip?: string
  userAgent?: string
  timestamp: Date
}

// Enums para status
export enum SystemStatus {
  ACTIVE = 'ATIVO',
  INACTIVE = 'INATIVO',
  PENDING = 'PENDENTE',
  COMPLETED = 'CONCLUIDO',
  CANCELLED = 'CANCELADO',
}

export enum ContactType {
  CLIENT = 'CLIENTE',
  SUPPLIER = 'FORNECEDOR',
  BOTH = 'AMBOS',
}

export enum CenterType {
  COST = 'CUSTO',
  PROFIT = 'LUCRO',
}

export enum RecurrenceType {
  FIXED = 'FIXA',
  INSTALLMENT = 'PARCELADA',
}

export enum Frequency {
  WEEKLY = 'SEMANAL',
  MONTHLY = 'MENSAL',
  YEARLY = 'ANUAL',
}
