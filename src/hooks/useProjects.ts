/**
 * CAMADA: Hooks
 * MÓDULO: Cadastros - Projetos
 * RESPONSABELIDADE: Camada de dados para UI (React Query)
 * NÃO DEVE: Conter lógica de negócio, validação ou acesso direto ao banco
 * DEPENDE DE: API routes, React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateProjectInput, UpdateProjectInput } from '@/schemas/projectSchema'

const API_BASE = '/api/projects'

export interface Project {
  id: string
  name: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
}

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Erro ao buscar projetos')
      return res.json()
    }
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar projeto')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProjectInput) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar projeto')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}

export function useDeleteProject(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir projeto')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
