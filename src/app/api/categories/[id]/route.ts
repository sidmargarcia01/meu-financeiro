/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: PUT e DELETE para categoria específica
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: categoryService, updateCategorySchema, withAuth
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updateCategorySchema } from '@/schemas/categorySchema'
import { categoryService } from '@/services/categoryService'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = updateCategorySchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const category = await categoryService.update(params.id, user.id, validation.data)
      return NextResponse.json(category, { status: 200 })
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      console.error('[api/categories/[id] PUT]', error)
      return NextResponse.json({ error: 'Erro ao atualizar categoria' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      await categoryService.delete(params.id, user.id)
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error: any) {
      const knownErrors = [
        'não encontrada',
        'lançamentos vinculados',
        'subcategorias'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      console.error('[api/categories/[id] DELETE]', error)
      return NextResponse.json({ error: 'Erro ao excluir categoria' }, { status: 500 })
    }
  })
}
