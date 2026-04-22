/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Centros de Custo
 * RESPONSABILIDADE: PUT e DELETE para centro de custo específico
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: costCenterService, updateCostCenterSchema, withAuth
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updateCostCenterSchema } from '@/schemas/costCenterSchema'
import { costCenterService } from '@/services/costCenterService'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req, user) => {
        try {
            const { id } = await params
            const body = await req.json()
            const validation = updateCostCenterSchema.safeParse(body)
            if (!validation.success) {
                return NextResponse.json(
                    { error: validation.error.errors[0].message },
                    { status: 400 }
                )
            }

            const costCenter = await costCenterService.update(id, user.id, validation.data)
            return NextResponse.json(costCenter, { status: 200 })
        } catch (error: any) {
            if (error.message?.includes('não encontrado')) {
                return NextResponse.json({ error: error.message }, { status: 404 })
            }
            console.error('[api/cost-centers/[id] PUT]', error)
            return NextResponse.json({ error: 'Erro ao atualizar centro de custo' }, { status: 500 })
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
            await costCenterService.delete(id, user.id)
            return NextResponse.json({ success: true }, { status: 200 })
        } catch (error: any) {
            const knownErrors = [
                'não encontrado',
                'lançamentos vinculados'
            ]
            if (knownErrors.some(e => error.message?.includes(e))) {
                return NextResponse.json({ error: error.message }, { status: 409 })
            }
            console.error('[api/cost-centers/[id] DELETE]', error)
            return NextResponse.json({ error: 'Erro ao excluir centro de custo' }, { status: 500 })
        }
    })
}