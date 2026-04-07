/**
 * CAMADA: Routes
 * MODULO: Alerts
 * RESPONSABILIDADE: Retornar alertas de vencimento do usuario autenticado
 * NAO DEVE: Conter logica de negocio, acessar banco diretamente,
 *            aceitar userId de query params ou body
 * DEPENDE DE: alertService, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { alertService } from '@/services/alertService'
import { withAuth } from '@/middlewares/auth'

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    try {
      const alerts = await alertService.getAlerts(user.id)
      return NextResponse.json(alerts, { status: 200 })
    } catch (error) {
      console.error('[alerts/route] Erro ao buscar alertas:', error)
      return NextResponse.json(
        { error: 'Erro interno ao buscar alertas' },
        { status: 500 }
      )
    }
  })
}
