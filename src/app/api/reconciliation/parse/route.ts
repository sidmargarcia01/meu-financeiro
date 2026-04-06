/**
 * CAMADA: Routes — MÓDULO: Reconciliation
 * RESPONSABILIDADE: POST /api/reconciliation/parse — parse OFX + sugestões de matching
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { ReconciliationService } from '@/services/reconciliationService'

const svc = new ReconciliationService()

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      if (!body.content) {
        return NextResponse.json({ error: 'Conteúdo OFX é obrigatório' }, { status: 400 })
      }

      const ofxTransactions = svc.parseOFX(body.content)
      if (ofxTransactions.length === 0) {
        return NextResponse.json({ error: 'Nenhuma transação encontrada no arquivo OFX' }, { status: 422 })
      }

      const matches = await svc.findMatches(user.id, ofxTransactions)
      return NextResponse.json({ total: matches.length, matches })
    } catch (error: any) {
      return NextResponse.json({ error: error.message || 'Erro ao processar OFX' }, { status: 500 })
    }
  })
}
