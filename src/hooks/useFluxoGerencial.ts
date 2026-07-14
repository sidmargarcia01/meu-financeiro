/**
 * 📄 Descrição: Hook para buscar dados da matriz de fluxo de caixa gerencial
 * 🧱 Contexto: Módulo Movimentações — página /movimentacoes/fluxo
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: React, TanStack Query
 * 🔍 Dependências: API /api/reports/fluxo-gerencial
 * ✅ Revisado: Sim
 */

import { useQuery } from '@tanstack/react-query'
import type { FluxoGerencialRelatorio } from '@/services/fluxoGerencialService'

interface UseFluxoGerencialParams {
  inicio: string
  fim: string
  regime?: 'CAIXA' | 'COMPETENCIA'
  enabled?: boolean
}

const fetchFluxoGerencial = async (
  params: UseFluxoGerencialParams
): Promise<FluxoGerencialRelatorio> => {
  const query = new URLSearchParams({
    inicio: params.inicio,
    fim: params.fim,
    regime: params.regime || 'CAIXA',
  })

  const res = await fetch(`/api/reports/fluxo-gerencial?${query}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Erro ao buscar fluxo de caixa gerencial')
  }
  return res.json()
}

export function useFluxoGerencial(params: UseFluxoGerencialParams) {
  const { inicio, fim, regime, enabled } = params

  const { data, isLoading, error, refetch } = useQuery<FluxoGerencialRelatorio>({
    queryKey: ['reports', 'fluxo-gerencial', inicio, fim, regime],
    queryFn: () => fetchFluxoGerencial(params),
    staleTime: 30_000,
    refetchInterval: 120_000,
    enabled: enabled !== false && Boolean(inicio && fim),
  })

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
