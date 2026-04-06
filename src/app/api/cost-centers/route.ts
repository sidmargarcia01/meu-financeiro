/**
 * CAMADA: Routes — MÓDULO: CostCenters
 * RESPONSABILIDADE: GET + POST /api/cost-centers
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { CostCenterService } from '@/services/businessService'

const svc = new CostCenterService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    const data = await svc.list(user.id).catch(() => [])
    return NextResponse.json(data)
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      if (!body.name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      const item = await svc.create(user.id, body)
      return NextResponse.json(item, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao criar' }, { status: 500 })
    }
  })
}
