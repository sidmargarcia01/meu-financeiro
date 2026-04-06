/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Widget Distribuição por Categoria
 * RESPONSABILIDADE: Buscar e gerenciar estado da distribuição por categoria
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard/categorias
 */

import { useQuery } from '@tanstack/react-query'

export interface Categoria {
  category_id: string
  category_name: string
  total: number
  percentual: number
  color?: string
  icon?: string
}

interface UseDistribuicaoCategoriasParams {
  mes: number
  ano: number
}

const fetchCategorias = async (mes: number, ano: number): Promise<Categoria[]> => {
  const params = new URLSearchParams({ mes: mes.toString(), ano: ano.toString() })
  const res = await fetch(`/api/dashboard/categorias?${params}`)
  if (!res.ok) throw new Error('Erro ao buscar distribuição por categorias')
  return res.json()
}

export function useDistribuicaoCategorias(params: UseDistribuicaoCategoriasParams) {
  const { data, isLoading, error, refetch } = useQuery<Categoria[]>({
    queryKey: ['dashboard', 'categorias', params.mes, params.ano],
    queryFn: () => fetchCategorias(params.mes, params.ano),
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
