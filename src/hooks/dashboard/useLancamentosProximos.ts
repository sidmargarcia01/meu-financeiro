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
  dueDate?: string
  account_name: string
  category_name?: string
  days_until_due: number
  is_overdue: boolean
}

interface LancamentosApiResponse {
  vencidos: Array<Record<string, unknown>>
  proximos_7_dias: Array<Record<string, unknown>>
}

const fetchLancamentos = async (): Promise<Lancamento[]> => {
  const res = await fetch('/api/dashboard/lancamentos-proximos')
  if (!res.ok) throw new Error('Erro ao buscar lançamentos próximos')
  const json = await res.json()

  // A API retorna { vencidos: [...], proximos_7_dias: [...] }
  if (json && !Array.isArray(json) && (json.vencidos || json.proximos_7_dias)) {
    const resp = json as LancamentosApiResponse
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const mapItem = (item: Record<string, unknown>, isOverdue: boolean): Lancamento => {
      const rawDate = (item.dueDate || item.due_date || '') as string
      const dueDate = String(rawDate)
      const target = new Date(dueDate)
      const targetValid = !isNaN(target.getTime())
      if (targetValid) target.setHours(0, 0, 0, 0)
      const diffDays = targetValid
        ? Math.round((target.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
        : 0

      return {
        id: String(item.id || ''),
        description: String(item.description || ''),
        amount: Number(item.amount || 0),
        type: (item.type as 'RECEITA' | 'DESPESA') || 'DESPESA',
        status: String(item.status || ''),
        due_date: dueDate,
        account_name: String(item.account_name || item.accountName || ''),
        category_name: item.category_name ? String(item.category_name) : item.categoryName ? String(item.categoryName) : undefined,
        days_until_due: diffDays,
        is_overdue: isOverdue,
      }
    }

    const vencidos = (resp.vencidos || []).map(i => mapItem(i, true))
    const proximos = (resp.proximos_7_dias || []).map(i => mapItem(i, false))
    return [...vencidos, ...proximos]
  }

  // Fallback: já é array
  if (Array.isArray(json)) return json

  return []
}

export function useLancamentosProximos() {
  const { data, isLoading, error, refetch } = useQuery<Lancamento[]>({
    queryKey: ['dashboard', 'lancamentos-proximos'],
    queryFn: fetchLancamentos,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return {
    data: data ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  }
}
