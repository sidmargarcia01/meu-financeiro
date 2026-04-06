/**
 * CAMADA: Routes — MÓDULO: Reconciliation
 * RESPONSABILIDADE: POST /api/reconciliation/confirm — marcar transações como CONCILIADO
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { ReconciliationService } from '@/services/reconciliationService'

const svc = new ReconciliationService()

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      if (!Array.isArray(body.ids) || body.ids.length === 0) {
        return NextResponse.json({ error: 'IDs são obrigatórios' }, { status: 400 })
      }
      const result = await svc.confirmMatches(user.id, body.ids)
      return NextResponse.json(result)
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Erro ao confirmar conciliação' }, { status: 500 })
    }
  })
}
