/**
 * CAMADA: Hooks
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABELIDADE: Camada de dados para UI (React Query)
 * NÃO DEVE: Conter lógica de negócio, validação ou acesso direto ao banco
 * DEPENDE DE: API routes, React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateCostCenterInput, UpdateCostCenterInput } from '@/schemas/costCenterSchema'

const API_BASE = '/api/cost-centers'

export interface CostCenter {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

export function useCostCenters() {
  return useQuery<CostCenter[]>({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Erro ao buscar centros de custo')
      return res.json()
    }
  })
}

export function useCreateCostCenter() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCostCenterInput) => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar centro de custo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] })
    }
  })
}

export function useUpdateCostCenter(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateCostCenterInput) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar centro de custo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] })
    }
  })
}

export function useDeleteCostCenter(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir centro de custo')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] })
    }
  })
}
