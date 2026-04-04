/**
 * CAMADA: Routes
 * MÓDULO: Categories
 * RESPONSABILIDADE: Endpoint para obter categoria específica
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, CategoryService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { CategoryService } from '@/services/categoryService'

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
      console.error('Erro ao obter categoria:', error)
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erro ao obter categoria' },
        { status: 500 }
      )
    }
  })
}
