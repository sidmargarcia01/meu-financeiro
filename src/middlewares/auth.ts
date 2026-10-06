/**
 * CAMADA: Middleware
 * MÓDULO: Auth
 * RESPONSABILIDADE: Verificar autenticação JWT e extrair usuário
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: Next.js, JWT, Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import { AuthUser } from '@/models/common'
import { createRequestClient, runWithSupabase } from '@/lib/requestSupabase'


export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const header = request.headers.get('authorization')
  const token = header?.startsWith('Bearer ') ? header.slice(7) : request.cookies.get('sb-access-token')?.value
  if (!token) return createAuthError('Não autorizado')
  const client = createRequestClient(token)
  let user
  try {
    const result = await client.auth.getUser(token)
    if (result.error || !result.data.user) return createAuthError('Sessão inválida ou expirada')
    user = result.data.user
  } catch {
    return createAuthError('Não foi possível validar a sessão', 503)
  }
  return runWithSupabase(client, () => handler(request, { id: user.id, email: user.email ?? '' }))
}

export async function withOptionalAuth(request: NextRequest,
  handler: (request: NextRequest, user?: AuthUser) => Promise<NextResponse>) {
  if (!request.cookies.get('sb-access-token')?.value && !request.headers.get('authorization')) {
    return handler(request)
  }
  return withAuth(request, handler)
}

// Middleware para verificar plano do usuário
export async function withPlanCheck(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>,
  requiredFeatures?: string[]
): Promise<NextResponse> {
  return withAuth(request, async (request, user) => {
    // TODO: Implementar verificação de plano quando tivermos o repositório
    // Por agora, apenas continua

    return handler(request, user)
  })
}

// Helper para criar resposta de erro de autenticação
export function createAuthError(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

// Helper para criar resposta de autorização
export function createAuthorizationError(message: string = 'Acesso negado'): NextResponse {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}
