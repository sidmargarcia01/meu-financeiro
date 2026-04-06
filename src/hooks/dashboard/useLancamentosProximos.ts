/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Widget Lançamentos Próximos
 * RESPONSABILIDADE: Buscar e gerenciar estado dos lançamentos próximos
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard/lancamentos-proximos
 */

import { useQuery } from '@tanstack/react-query'

export interface Lancamento {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA'
  status: string
  due_date: string
  account_name: string
  category_name?: string
  days_until_due: number
  is_overdue: boolean
}

const fetchLancamentos = async (): Promise<Lancamento[]> => {
  const res = await fetch('/api/dashboard/lancamentos-proximos')
  if (!res.ok) throw new Error('Erro ao buscar lançamentos próximos')
  return res.json()
}

export function useLancamentosProximos() {
  const { data, isLoading, error, refetch } = useQuery<Lancamento[]>({
    queryKey: ['dashboard', 'lancamentos-proximos'],
    queryFn: fetchLancamentos,
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
