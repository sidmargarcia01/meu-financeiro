/**
 * CAMADA: Routes — MÓDULO: CostCenters
 * RESPONSABILIDADE: PUT + DELETE /api/cost-centers/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { CostCenterService } from '@/services/businessService'

const svc = new CostCenterService()

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const item = await svc.update(user.id, params.id, body)
      return NextResponse.json(item)
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao atualizar' }, { status: 500 })
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      await svc.delete(user.id, params.id)
      return NextResponse.json({ success: true })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao excluir' }, { status: 500 })
    }
  })
}
