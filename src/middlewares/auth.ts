/**
 * CAMADA: Middleware
 * MÓDULO: Auth
 * RESPONSABILIDADE: Verificar autenticação JWT e extrair usuário
 * NÃO DEVE: Conter lógica de negócio ou manipulação de dados
 * DEPENDE DE: Next.js, JWT, Supabase
 */

import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { config } from '@/config'
import { AuthUser } from '@/models/common'

// Interface para payload JWT
interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

// Extrair token do header Authorization
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    return null
  }
  
  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ')
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

// Verificar e decodificar token JWT
function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

// Middleware principal de autenticação
export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  // Prioridade 1: headers injetados pelo middleware Next.js (Supabase session)
  const userId = request.headers.get('x-user-id')
  const userEmail = request.headers.get('x-user-email')

  if (userId) {
    const user: AuthUser = {
      id: userId,
      email: userEmail ?? '',
    }
    return handler(request, user)
  }

  // Prioridade 2: Bearer JWT (fallback para chamadas diretas à API)
  const token = extractToken(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Token não fornecido' },
      { status: 401 }
    )
  }

  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado' },
      { status: 401 }
    )
  }

  const user: AuthUser = {
    id: payload.userId,
    email: payload.email,
  }

  return handler(request, user)
}

// Middleware para rotas públicas (opcional)
export function withOptionalAuth(
  request: NextRequest,
  handler: (request: NextRequest, user?: AuthUser) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractToken(request)
  
  if (!token) {
    return handler(request)
  }
  
  const payload = verifyToken(token)
  
  if (!payload) {
    return handler(request)
  }
  
  const user: AuthUser = {
    id: payload.userId,
    email: payload.email,
  }
  
  return handler(request, user)
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
