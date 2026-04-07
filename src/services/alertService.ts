/**
 * CAMADA: Service
 * MODULO: Alerts
 * RESPONSABILIDADE: Calcular e agregar alertas de vencimento para o header
 * NAO DEVE: Acessar banco diretamente, importar Prisma ou Supabase,
 *            conter logica de UI ou formatacao de datas
 * DEPENDE DE: transactionRepository
 */

import { transactionRepository } from '@/repositories/transactionRepository'

export interface Alert {
  id: string
  description: string
  amount: number
  due_date: string
  type: 'RECEITA' | 'DESPESA'
  days_overdue?: number
}

export interface AlertSummary {
  vencidos: Alert[]
  vence_hoje: Alert[]
  vence_amanha: Alert[]
  total: number
}

export const alertService = {
  async getAlerts(userId: string): Promise<AlertSummary> {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const trintaDiasAtras = new Date(hoje)
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const lancamentos = await transactionRepository.findUpcoming(userId, {
      status: 'PENDENTE',
      dateFrom: trintaDiasAtras.toISOString().split('T')[0],
      dateTo: amanha.toISOString().split('T')[0],
    })

    const vencidos: Alert[] = []
    const vence_hoje: Alert[] = []
    const vence_amanha: Alert[] = []

    for (const tx of lancamentos) {
      const due = new Date(tx.dueDate)
      due.setHours(0, 0, 0, 0)

      const diffDays = Math.round(
        (due.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
      )

      const dueDateStr = due.toISOString().split('T')[0]
      const type = tx.type === 'TRANSFERENCIA' ? 'DESPESA' : tx.type

      const alert: Alert = {
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        due_date: dueDateStr,
        type,
      }

      if (diffDays < 0) {
        vencidos.push({ ...alert, days_overdue: Math.abs(diffDays) })
      } else if (diffDays === 0) {
        vence_hoje.push(alert)
      } else if (diffDays === 1) {
        vence_amanha.push(alert)
      }
    }

    return {
      vencidos,
      vence_hoje,
      vence_amanha,
      total: vencidos.length + vence_hoje.length + vence_amanha.length,
    }
  },
}
