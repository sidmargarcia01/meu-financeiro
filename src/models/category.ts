/**
 * CAMADA: Model
 * MÓDULO: Category
 * RESPONSABILIDADE: Definir tipos e schemas de validação para categorias
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod
 */

import { z } from 'zod'

// Schema para criação de categoria
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(100),
  description: z.string().max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hex válido').optional(),
  icon: z.string().optional(),
  parentId: z.string().uuid().optional(),
  type: z.enum(['RECEITA', 'DESPESA']),
  isActive: z.boolean().default(true),
})

// Schema para atualização de categoria
export const updateCategorySchema = createCategorySchema.partial()

// Types
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>

// Interfaces para retorno de dados
export interface Category {
  id: string
  userId: string
  name: string
  description?: string
  color?: string
  icon?: string
  parentId?: string
  type: 'RECEITA' | 'DESPESA'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CategoryWithChildren extends Category {
  children: Category[]
  level: number
}

export interface CategoryTree {
  [key: string]: CategoryWithChildren
}
