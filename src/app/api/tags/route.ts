/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: GET lista e POST nova tag
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: tagService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createTagSchema } from '@/schemas/tagSchema'
import { tagService } from '@/services/tagService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const tags = await tagService.getAll(user.id)
      return NextResponse.json(tags, { status: 200 })
    } catch (error) {
      console.error('[api/tags GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar tags' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createTagSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const tag = await tagService.create(user.id, validation.data)
      return NextResponse.json(tag, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe uma tag',
        'Nome é obrigatório',
        'Nome deve ter no máximo',
        'Cor deve ser um código hex'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/tags POST]', error)
      return NextResponse.json({ error: 'Erro ao criar tag' }, { status: 500 })
    }
  })
}
