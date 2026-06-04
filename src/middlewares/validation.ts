/**
 * CAMADA: Middleware
 * MÓDULO: Validation
 * RESPONSABILIDADE: Validar entrada de dados com Zod
 * NÃO DEVE: Conter lógica de negócio ou acesso a dados
 * DEPENDE DE: Zod, Next.js
 */

import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

// Middleware principal de validação
export async function withValidation<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extrair dados da requisição
    let data: any

    const contentType = request.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      // Requisição JSON
      const body = await request.json()
      data = body
    } else if (contentType?.includes('application/x-www-form-urlencoded')) {
      // Requisição form data
      const formData = await request.formData()
      data = Object.fromEntries(formData.entries())
    } else if (request.method === 'GET') {
      // Requisição GET - usar query params
      data = Object.fromEntries(request.nextUrl.searchParams.entries())
    } else {
      return NextResponse.json(
        { error: 'Content-Type não suportado' },
        { status: 400 }
      )
    }

    // Validar com Zod
    const validatedData = schema.parse(data)

    // Executar handler com dados validados
    return handler(request, validatedData)

  } catch (error) {
    if (error instanceof ZodError) {
      // Erro de validação Zod
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      const firstError = details[0]
      return NextResponse.json(
        {
          error: firstError ? `${firstError.field}: ${firstError.message}` : 'Dados inválidos',
          details,
        },
        { status: 400 }
      )
    }

    // Outros erros
    console.error('Erro de validação:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

// Middleware para validação de query params
export async function withQueryValidation<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  handler: (request: NextRequest, query: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Extrair query params
    const query = Object.fromEntries(request.nextUrl.searchParams.entries())

    // Validar com Zod
    const validatedQuery = schema.parse(query)

    // Executar handler com query validado
    return handler(request, validatedQuery)

  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      const firstError = details[0]
      return NextResponse.json(
        {
          error: firstError ? `${firstError.field}: ${firstError.message}` : 'Parâmetros inválidos',
          details,
        },
        { status: 400 }
      )
    }

    console.error('Erro de validação de query:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

// Middleware para validação de parâmetros de rota
export async function withParamsValidation<T>(
  request: NextRequest,
  params: Record<string, string>,
  schema: ZodSchema<T>,
  handler: (request: NextRequest, params: T) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Validar parâmetros com Zod
    const validatedParams = schema.parse(params)

    // Executar handler com parâmetros validados
    return handler(request, validatedParams)

  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      const firstError = details[0]
      return NextResponse.json(
        {
          error: firstError ? `${firstError.field}: ${firstError.message}` : 'Parâmetros da rota inválidos',
          details,
        },
        { status: 400 }
      )
    }

    console.error('Erro de validação de parâmetros:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

// Helper para criar middleware combinado (autenticação + validação)
// TODO: Implementar quando necessário
// export function withAuthAndValidation<T>(
//   request: NextRequest,
//   schema: ZodSchema<T>,
//   handler: (request: NextRequest, data: T, user: any) => Promise<NextResponse>
// ): Promise<NextResponse> {
//   // Importar aqui para evitar dependência circular
//   const { withAuth } = require('./auth')
//   
//   return withAuth(request, async (request, user) => {
//     return withValidation(request, schema, handler)
//   })
// }
