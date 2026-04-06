/**
 * CAMADA: Routes — MÓDULO: Tags
 * RESPONSABILIDADE: GET + POST /api/tags
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { TagService } from '@/services/businessService'

const svc = new TagService()

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
