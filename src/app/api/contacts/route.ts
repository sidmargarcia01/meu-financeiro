/**
 * CAMADA: Routes
 * MÓDULO: Cadastros - Contatos
 * RESPONSABILIDADE: GET lista e POST novo contato
 * NÃO DEVE: Conter lógica de negócio, acessar banco diretamente
 * DEPENDE DE: contactService, Zod, withAuth middleware
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/middlewares/auth'
import { createContactSchema } from '@/schemas/contactSchema'
import { contactService } from '@/services/contactService'

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const contacts = await contactService.getAll(user.id)
      return NextResponse.json(contacts, { status: 200 })
    } catch (error) {
      console.error('[api/contacts GET]', error)
      return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const body = await req.json()
      const validation = createContactSchema.safeParse(body)
      if (!validation.success) {
        return NextResponse.json(
          { error: validation.error.errors[0].message },
          { status: 400 }
        )
      }

      const contact = await contactService.create(user.id, validation.data)
      return NextResponse.json(contact, { status: 201 })
    } catch (error: any) {
      const knownErrors = [
        'Já existe um contato',
        'Nome é obrigatório',
        'Nome deve ter no máximo',
        'Email inválido',
        'Telefone deve ter'
      ]
      if (knownErrors.some(e => error.message?.includes(e))) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      console.error('[api/contacts POST]', error)
      return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
    }
  })
}
