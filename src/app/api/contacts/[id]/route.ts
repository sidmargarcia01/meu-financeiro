/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: PUT e DELETE para contato específico
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: contactService, updateContactSchema, withAuth
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updateContactSchema } from '@/schemas/contactSchema'
import { contactService } from '@/services/contactService'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req, user) => {
        try {
            const { id } = await params
            const body = await req.json()
            const validation = updateContactSchema.safeParse(body)
            if (!validation.success) {
                return NextResponse.json(
                    { error: validation.error.errors[0].message },
                    { status: 400 }
                )
            }

            const contact = await contactService.update(id, user.id, validation.data)
            return NextResponse.json(contact, { status: 200 })
        } catch (error: any) {
            if (error.message?.includes('não encontrado')) {
                return NextResponse.json({ error: error.message }, { status: 404 })
            }
            console.error('[api/contacts/[id] PUT]', error)
            return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 })
        }
    })
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req, user) => {
        try {
            const { id } = await params
            await contactService.delete(id, user.id)
            return NextResponse.json({ success: true }, { status: 200 })
        } catch (error: any) {
            const knownErrors = [
                'não encontrado',
                'lançamentos vinculados'
            ]
            if (knownErrors.some(e => error.message?.includes(e))) {
                return NextResponse.json({ error: error.message }, { status: 409 })
            }
            console.error('[api/contacts/[id] DELETE]', error)
            return NextResponse.json({ error: 'Erro ao excluir contato' }, { status: 500 })
        }
    })
}