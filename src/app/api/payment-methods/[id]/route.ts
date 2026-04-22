/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: PUT e DELETE para forma de pagamento específica
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: paymentMethodService, updatePaymentMethodSchema, withAuth
 */

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { updatePaymentMethodSchema } from '@/schemas/paymentMethodSchema'
import { paymentMethodService } from '@/services/paymentMethodService'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = await params
      const body = await req.json()
      const validation = updatePaymentMethodSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const paymentMethod = await paymentMethodService.update(id, user.id, validation.data)
      return NextResponse.json(paymentMethod, { status: 200 })
    } catch (error: any) {
      if (error.message?.includes('não encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      console.error('[api/payment-methods/[id] PUT]', error)
      return NextResponse.json({ error: 'Erro ao atualizar forma de pagamento' }, { status: 500 })
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
      await paymentMethodService.delete(id, user.id)
      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error: any) {
      const knownErrors = [
        'não encontrada',
        'lançamentos vinculados'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      console.error('[api/payment-methods/[id] DELETE]', error)
      return NextResponse.json({ error: 'Erro ao excluir forma de pagamento' }, { status: 500 })
    }
  })
}
