/**
 * CAMADA: Hooks
 * MÓDULO: Cadastros - Categorias
 * RESPONSABELIDADE: Camada de dados para UI (React Query)
 * NÃO DEVE: Conter lógica de negócio, validação ou acesso direto ao banco
 * DEPENDE DE: API routes, React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateCategoryInput, UpdateCategoryInput } from '@/schemas/categorySchema'
import type { CategoryWithChildren } from '@/services/categoryService'

const API_BASE = '/api/categories'

export function useCategories(type?: string) {
  return useQuery<CategoryWithChildren[]>({
    queryKey: ['categories', type],
    queryFn: async () => {
      const url = type ? `${API_BASE}?type=${type}` : API_BASE
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro ao buscar categorias')
      return res.json()
    }
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar categoria')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar categoria')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir categoria')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    }
  })
}
