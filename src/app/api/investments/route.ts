/**
 * CAMADA: Routes — MÓDULO: Investments
 * RESPONSABILIDADE: GET + POST /api/investments
 */
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { InvestmentService } from '@/services/investmentService'

const svc = new InvestmentService()

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      if (searchParams.get('portfolio') === 'true') {
        const portfolio = await svc.getPortfolio(user.id)
        return NextResponse.json(portfolio)
      }
      const data = await svc.list(user.id)
      return NextResponse.json(data)
    } catch {
      return NextResponse.json({ error: 'Erro ao buscar investimentos' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      if (!body.name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
      if (!body.quantity || !body.averagePrice) return NextResponse.json({ error: 'Quantidade e preço médio são obrigatórios' }, { status: 400 })
      const item = await svc.create(user.id, body)
      return NextResponse.json(item, { status: 201 })
    } catch (e: any) {
      return NextResponse.json({ error: e.message || 'Erro ao criar' }, { status: 500 })
    }
  })
}
