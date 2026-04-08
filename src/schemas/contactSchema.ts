/**
 * CAMADA: Schema
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: Validação de entrada para contatos
 * NÃO DEVE: Conter lógica de negócio ou acesso ao banco
 */

import { z } from 'zod'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const createContactSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .optional()
    .nullable(),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .optional()
    .nullable()
})

export const updateContactSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100)
    .trim()
    .optional(),
  email: z.string()
    .email('Email inválido')
    .optional()
    .nullable(),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(15, 'Telefone deve ter no máximo 15 dígitos')
    .optional()
    .nullable()
})

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
