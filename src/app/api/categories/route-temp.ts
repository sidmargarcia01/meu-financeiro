/**
 * VERSÃO TEMPORÁRIA SEM AUTENTICAÇÃO PARA TESTE
 * APAGUE ESTE ARQUILO APÓS CONFIGURAR O JWT
 */

import { NextRequest, NextResponse } from 'next/server'
import { createCategorySchema } from '@/schemas/categorySchema'
import { categoryService } from '@/services/categoryService'

export async function GET(request: NextRequest) {
  try {
    // Usando um ID de usuário fixo para teste
    const testUserId = 'test-user-id'
    const categories = await categoryService.getAll(testUserId)
    return NextResponse.json(categories, { status: 200 })
  } catch (error) {
    console.error('[api/categories GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = createCategorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Usando um ID de usuário fixo para teste
    const testUserId = 'test-user-id'
    const category = await categoryService.create(testUserId, validation.data)
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('[api/categories POST]', error)
    return NextResponse.json({ error: 'Erro ao criar categoria' }, { status: 500 })
  }
}
