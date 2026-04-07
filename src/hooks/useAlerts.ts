/**
 * CAMADA: Hook
 * MODULO: Alerts
 * RESPONSABILIDADE: Buscar e cachear alertas de vencimento para o header
 * NAO DEVE: Conter logica de negocio, calcular datas, classificar alertas
 * DEPENDE DE: @tanstack/react-query, API /api/alerts
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import type { AlertSummary } from '@/services/alertService'

export function useAlerts() {
  return useQuery<AlertSummary>({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts')
      if (!response.ok) throw new Error('Erro ao buscar alertas')
      return response.json()
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
  })
}
