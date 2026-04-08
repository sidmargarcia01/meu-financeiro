/**
 * CAMADA: Hooks
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABELIDADE: Camada de dados para UI (React Query)
 * NÃO DEVE: Conter lógica de negócio, validação ou acesso direto ao banco
 * DEPENDE DE: API routes, React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreatePaymentMethodInput, UpdatePaymentMethodInput } from '@/schemas/paymentMethodSchema'

const API_BASE = '/api/payment-methods'

export interface PaymentMethod {
  id: string
  name: string
  type: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'PIX' | 'OTHER'
  user_id: string
  created_at: string
  updated_at: string
}

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await fetch(API_BASE)
      if (!res.ok) throw new Error('Erro ao buscar formas de pagamento')
      return res.json()
    }
  })
}

export function useCreatePaymentMethod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePaymentMethodInput) => {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao criar forma de pagamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    }
  })
}

export function useUpdatePaymentMethod(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdatePaymentMethodInput) => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao atualizar forma de pagamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    }
  })
}

export function useDeletePaymentMethod(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao excluir forma de pagamento')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    }
  })
}
