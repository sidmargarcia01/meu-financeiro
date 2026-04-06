/**
 * CAMADA: Routes
 * MÓDULO: Categories
 * RESPONSABILIDADE: Endpoints GET | PUT | DELETE para categoria específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, CategoryService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { CategoryService } from '@/services/categoryService'
import { updateCategorySchema } from '@/models/category'

const categoryService = new CategoryService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const category = await categoryService.findById(user.id, params.id)
      return NextResponse.json(category)
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: 'Erro ao obter categoria' }, { status: 500 })
    }
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, updateCategorySchema, async (req, data) => {
      try {
        const category = await categoryService.update(user.id, params.id, data)
        return NextResponse.json(category)
      } catch (error: any) {
        if (error.message?.includes('não encontrada')) {
          return NextResponse.json({ error: error.message }, { status: 404 })
        }
        return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
      }
    })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      await categoryService.delete(user.id, params.id)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message?.includes('lançamentos') || error.message?.includes('subcategorias')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
    }
  })
}
