/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Projetos
 * RESPONSABILIDADE: GET lista e POST novo projeto
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: projectService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createProjectSchema } from '@/schemas/projectSchema'
import { projectService } from '@/services/projectService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const projects = await projectService.getAll(user.id)
      return NextResponse.json(projects, { status: 200 })
    } catch (error) {
      console.error('[api/projects GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar projetos' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createProjectSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const project = await projectService.create(user.id, validation.data)
      return NextResponse.json(project, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe um projeto',
        'Nome é obrigatório',
        'Nome deve ter no máximo'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/projects POST]', error)
      return NextResponse.json({ error: 'Erro ao criar projeto' }, { status: 500 })
    }
  })
}
