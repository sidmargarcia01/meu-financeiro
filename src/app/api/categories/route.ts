/**
 * CAMADA: Routes
 * MÓDULO: Categories
 * RESPONSABILIDADE: Endpoints para gestão de categorias
 * NÃO DEVE: Conter lógica de negócio complexa
 * DEPENDE DE: Next.js, middlewares, CategoryService
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { withValidation } from '@/middlewares/validation'
import { CategoryService } from '@/services/categoryService'
import { createCategorySchema, updateCategorySchema } from '@/models/category'

const categoryService = new CategoryService()

// GET /api/categories - Listar categorias do usuário
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const includeInactive = searchParams.get('includeInactive') === 'true'
      const hierarchical = searchParams.get('hierarchical') === 'true'
      
      if (hierarchical) {
        const categories = await categoryService.listHierarchical(user.id, includeInactive)
        return NextResponse.json(categories)
      } else {
        const categories = await categoryService.list(user.id, includeInactive)
        return NextResponse.json(categories)
      }
    } catch (error) {
      console.error('Erro ao listar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao listar categorias' },
        { status: 500 }
      )
    }
  })
}

// POST /api/categories - Criar categoria
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    return withValidation(req, createCategorySchema, async (req, data) => {
      try {
        const category = await categoryService.create(user.id, {
          ...data,
          isActive: data.isActive ?? true
        })
        return NextResponse.json(category, { status: 201 })
      } catch (error) {
        console.error('Erro ao criar categoria:', error)
        
        if (error instanceof Error) {
          return NextResponse.json(
            { error: error.message },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { error: 'Erro ao criar categoria' },
          { status: 500 }
        )
      }
    })
  })
}
