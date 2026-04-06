/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Widget Saldo Consolidado
 * RESPONSABILIDADE: Buscar e gerenciar estado do saldo consolidado via React Query
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard/saldo, @tanstack/react-query
 */

import { useQuery } from '@tanstack/react-query'

interface SaldoPorConta {
  account_id: string
  account_name: string
  projetado: number
  confirmado: number
  currency: string
}

export interface SaldoConsolidado {
  total_projetado: number
  total_confirmado: number
  por_conta: SaldoPorConta[]
}

const fetchSaldo = async (): Promise<SaldoConsolidado> => {
  const res = await fetch('/api/dashboard/saldo')
  if (!res.ok) throw new Error('Erro ao buscar saldo consolidado')
  return res.json()
}

export function useSaldoConsolidado() {
  const { data, isLoading, error, refetch } = useQuery<SaldoConsolidado>(
    {
      queryKey: ['dashboard', 'saldo'],
      queryFn: fetchSaldo,
      staleTime: 30_000,
      refetchInterval: 60_000,
    }
  )

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
