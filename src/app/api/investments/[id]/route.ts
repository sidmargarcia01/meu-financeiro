/**
 * CAMADA: Routes — MÓDULO: Investments
 * RESPONSABILIDADE: PUT + DELETE /api/investments/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { InvestmentService } from '@/services/investmentService'

const svc = new InvestmentService()

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      const body = await req.json()
      const item = await svc.update(user.id, id, body)
      return NextResponse.json(item)
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao atualizar' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      await svc.delete(user.id, id)
      return NextResponse.json({ success: true })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao excluir' }, { status: 500 })
    }
  })
}
