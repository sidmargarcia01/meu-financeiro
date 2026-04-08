/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: GET lista e POST novo centro de custo
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: costCenterService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createCostCenterSchema } from '@/schemas/costCenterSchema'
import { costCenterService } from '@/services/costCenterService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const costCenters = await costCenterService.getAll(user.id)
      return NextResponse.json(costCenters, { status: 200 })
    } catch (error) {
      console.error('[api/cost-centers GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar centros de custo' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createCostCenterSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const costCenter = await costCenterService.create(user.id, validation.data)
      return NextResponse.json(costCenter, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe um centro de custo',
        'Nome é obrigatório',
        'Nome deve ter no máximo'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/cost-centers POST]', error)
      return NextResponse.json({ error: 'Erro ao criar centro de custo' }, { status: 500 })
    }
  })
}
