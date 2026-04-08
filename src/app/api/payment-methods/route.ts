/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Formas de Pagamento
 * RESPONSABILIDADE: GET lista e POST nova forma de pagamento
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: paymentMethodService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createPaymentMethodSchema } from '@/schemas/paymentMethodSchema'
import { paymentMethodService } from '@/services/paymentMethodService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const paymentMethods = await paymentMethodService.getAll(user.id)
      return NextResponse.json(paymentMethods, { status: 200 })
    } catch (error) {
      console.error('[api/payment-methods GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar formas de pagamento' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createPaymentMethodSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const paymentMethod = await paymentMethodService.create(user.id, validation.data)
      return NextResponse.json(paymentMethod, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe uma forma de pagamento',
        'Nome é obrigatório',
        'Nome deve ter no máximo',
        'Tipo de pagamento inválido'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/payment-methods POST]', error)
      return NextResponse.json({ error: 'Erro ao criar forma de pagamento' }, { status: 500 })
    }
  })
}
