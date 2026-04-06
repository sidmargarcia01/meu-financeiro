/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Widget Resumo Mensal
 * RESPONSABILIDADE: Buscar e gerenciar estado do resumo mensal
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard/resumo-mensal
 */

import { useQuery } from '@tanstack/react-query'

export interface ResumoMensal {
  mes: number
  ano: number
  receitas: number
  despesas: number
  saldo: number
  comparativo_mes_anterior?: {
    receitas: number
    despesas: number
    saldo: number
    variacao_receitas_percent: number
    variacao_despesas_percent: number
    variacao_saldo_percent: number
  }
}

interface UseResumoMensalParams {
  mes?: number
  ano?: number
}

const fetchResumo = async (mes?: number, ano?: number): Promise<ResumoMensal> => {
  const params = new URLSearchParams()
  if (mes) params.append('mes', mes.toString())
  if (ano) params.append('ano', ano.toString())
  const url = `/api/dashboard/resumo-mensal${params.toString() ? `?${params}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Erro ao buscar resumo mensal')
  return res.json()
}

export function useResumoMensal(params?: UseResumoMensalParams) {
  const { data, isLoading, error, refetch } = useQuery<ResumoMensal>({
    queryKey: ['dashboard', 'resumo-mensal', params?.mes, params?.ano],
    queryFn: () => fetchResumo(params?.mes, params?.ano),
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
