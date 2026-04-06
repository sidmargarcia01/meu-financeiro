/**
 * CAMADA: Hooks
 * MÓDULO: Dashboard - Hook Consolidado
 * RESPONSABILIDADE: Buscar todos os dados do dashboard de uma vez
 * NÃO DEVE: Conter lógica de negócio, apenas chamadas à API
 * DEPENDE DE: API /api/dashboard
 */

import { useState, useEffect } from 'react'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

interface SaldoPorConta {
  account_id: string
  account_name: string
  projetado: number
  confirmado: number
  currency: string
}

interface SaldoConsolidado {
  total_projetado: number
  total_confirmado: number
  por_conta: SaldoPorConta[]
}

interface ResumoMensal {
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

interface FluxoMes {
  mes: string
  ano: number
  receitas: number
  despesas: number
  saldo: number
  acumulado: number
}

interface Lancamento {
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

interface Categoria {
  category_id: string
  category_name: string
  total: number
  percentual: number
  color?: string
  icon?: string
}

interface DashboardData {
  saldo: SaldoConsolidado
  resumoMensal: ResumoMensal
  fluxoCaixa: FluxoMes[]
  lancamentosProximos: Lancamento[]
  categorias: Categoria[]
}

interface UseDashboardParams {
  mes?: number
  ano?: number
  mesesFluxo?: number
}

interface UseDashboardReturn {
  data: DashboardData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(params?: UseDashboardParams): UseDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSupabaseAuth()

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = session?.access_token
      if (!token) {
        throw new Error('Não autenticado')
      }

      const queryParams = new URLSearchParams()
      if (params?.mes) queryParams.append('mes', params.mes.toString())
      if (params?.ano) queryParams.append('ano', params.ano.toString())
      if (params?.mesesFluxo) queryParams.append('meses', params.mesesFluxo.toString())

      const url = `/api/dashboard${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDashboard()
    } else {
      setLoading(false)
    }
  }, [params?.mes, params?.ano, params?.mesesFluxo, session])

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard
  }
}
