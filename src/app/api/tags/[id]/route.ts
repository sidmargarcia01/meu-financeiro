/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Tags
 * RESPONSABILIDADE: PUT e DELETE para tag específica
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: tagService, updateTagSchema, withAuth
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updateTagSchema } from '@/schemas/tagSchema'
import { tagService } from '@/services/tagService'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withAuth(request, async (req, user) => {
        try {
            const body = await req.json()
            const validation = updateTagSchema.safeParse(body)
            if (!validation.success) {
                return NextResponse.json(
                    { error: validation.error.errors[0].message },
                    { status: 400 }
                )
            }

            const tag = await tagService.update(params.id, user.id, validation.data)
            return NextResponse.json(tag, { status: 200 })
        } catch (error: any) {
            if (error.message?.includes('não encontrada')) {
                return NextResponse.json({ error: error.message }, { status: 404 })
            }
            console.error('[api/tags/[id] PUT]', error)
            return NextResponse.json({ error: 'Erro ao atualizar tag' }, { status: 500 })
        }
    })
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withAuth(request, async (req, user) => {
        try {
            await tagService.delete(params.id, user.id)
            return NextResponse.json({ success: true }, { status: 200 })
        } catch (error: any) {
            const knownErrors = [
                'não encontrada',
                'lançamentos vinculados'
            ]
            if (knownErrors.some(e => error.message?.includes(e))) {
                return NextResponse.json({ error: error.message }, { status: 409 })
            }
            console.error('[api/tags/[id] DELETE]', error)
            return NextResponse.json({ error: 'Erro ao excluir tag' }, { status: 500 })
        }
    })
}