/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: GET lista e POST nova categoria
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: categoryService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createCategorySchema } from '@/schemas/categorySchema'
import { categoryService } from '@/services/categoryService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const categories = await categoryService.getAll(user.id)
      return NextResponse.json(categories, { status: 200 })
    } catch (error) {
      console.error('[api/categories GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createCategorySchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const category = await categoryService.create(user.id, validation.data)
      return NextResponse.json(category, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe uma categoria',
        'Nome é obrigatório',
        'Nome deve ter no máximo'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/categories POST]', error)
      return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
    }
  })
}