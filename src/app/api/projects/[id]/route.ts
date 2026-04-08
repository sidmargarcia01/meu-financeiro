/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Projetos
 * RESPONSABILIDADE: PUT e DELETE para projeto específico
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: projectService, updateProjectSchema, withAuth
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updateProjectSchema } from '@/schemas/projectSchema'
import { projectService } from '@/services/projectService'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = updateProjectSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const project = await projectService.update(params.id, user.id, validation.data)
      return NextResponse.json(project, { status: 200 })
    } catch (error: any) {
      if (error.message?.includes('não encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      console.error('[api/projects/[id] PUT]', error)
      return NextResponse.json({ error: 'Erro ao atualizar projeto' }, { status: 500 })
    }
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      await projectService.delete(params.id, user.id)
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error: any) {
      const knownErrors = [
        'não encontrado',
        'lançamentos vinculados'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      console.error('[api/projects/[id] DELETE]', error)
      return NextResponse.json({ error: 'Erro ao excluir projeto' }, { status: 500 })
    }
  })
}