/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: Validação de entrada para formas de pagamento
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

const paymentTypes = ['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'PIX', 'OTHER'] as const

export const createPaymentMethodSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50, 'Nome deve ter no máximo 50 caracteres')
    .trim(),
  type: z.enum(paymentTypes, {
    errorMap: () => ({ message: 'Tipo de pagamento inválido' })
  })
})

export const updatePaymentMethodSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(50)
    .trim()
    .optional(),
  type: z.enum(paymentTypes, {
    errorMap: () => ({ message: 'Tipo de pagamento inválido' })
  }).optional()
})

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>
