/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Widget Fluxo de Caixa
 * RESPONSABILIDADE: Buscar e gerenciar estado do fluxo de caixa
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard/fluxo-caixa
 */

import { useQuery } from '@tanstack/react-query'

export interface FluxoMes {
  mes: string
  ano: number
  receitas: number
  despesas: number
  saldo: number
  acumulado: number
}

interface UseFluxoCaixaParams {
  meses?: number
}

const fetchFluxo = async (meses?: number): Promise<FluxoMes[]> => {
  const params = new URLSearchParams()
  if (meses) params.append('meses', meses.toString())
  const url = `/api/dashboard/fluxo-caixa${params.toString() ? `?${params}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar fluxo de caixa')
  return res.json()
}

export function useFluxoCaixa(params?: UseFluxoCaixaParams) {
  const { data, isLoading, error, refetch } = useQuery<FluxoMes[]>({
    queryKey: ['dashboard', 'fluxo-caixa', params?.meses],
    queryFn: () => fetchFluxo(params?.meses),
    staleTime: 30_000,
    refetchInterval: 120_000,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
