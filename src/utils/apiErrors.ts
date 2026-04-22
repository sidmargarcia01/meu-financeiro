/**
 * CAMADA: Utils
 * MÓDULO: API Errors
 * RESPONSABILIDADE: Tratamento padronizado de erros em APIs
 * NÃO DEVE: Conter lógica de negócio específica
 * DEPENDE DE: Next.js
 */

import { NextResponse } from 'next/server'

// Tipos de erros da aplicação
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Não autorizado') {
    super(message, 401, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN')
    this.name = 'ForbiddenError'
  }
}

// Interface para resposta de erro padronizada
interface ErrorResponse {
  error: string
  code: string
  message: string
  details?: Record<string, unknown>
}

// Criar resposta de erro padronizada
export function createErrorResponse(
  error: unknown,
  includeDetails = false
): NextResponse<ErrorResponse> {
  // Se for um AppError, usar suas propriedades
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.name,
        code: error.code,
        message: error.message,
      },
      { status: error.statusCode }
    )
  }

  // Se for um erro genérico
  if (error instanceof Error) {
    // Em produção, não expor detalhes do erro
    const isProduction = process.env.NODE_ENV === 'production'
    
    return NextResponse.json(
      {
        error: 'InternalError',
        code: 'INTERNAL_ERROR',
        message: isProduction ? 'Erro interno do servidor' : error.message,
        ...(includeDetails && !isProduction && { details: { stack: error.stack } }),
      },
      { status: 500 }
    )
  }

  // Erro desconhecido
  return NextResponse.json(
    {
      error: 'UnknownError',
      code: 'UNKNOWN_ERROR',
      message: 'Ocorreu um erro desconhecido',
    },
    { status: 500 }
  )
}

// Wrapper para handlers de API com tratamento de erro padronizado
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ErrorResponse>> {
  return handler().catch((error) => createErrorResponse(error))
}

// Log seguro que não expõe dados sensíveis
export function safeLog(
  level: 'error' | 'warn' | 'info',
  message: string,
  context?: Record<string, unknown>
): void {
  // Campos sensíveis que devem ser filtrados
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie']
  
  const sanitizeValue = (key: string, value: unknown): unknown => {
    if (typeof key !== 'string') return value
    
    const lowerKey = key.toLowerCase()
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      return '[REDACTED]'
    }
    
    if (typeof value === 'object' && value !== null) {
      return sanitizeObject(value as Record<string, unknown>)
    }
    
    return value
  }
  
  const sanitizeObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeValue(key, value)
    }
    return result
  }
  
  const sanitizedContext = context ? sanitizeObject(context) : undefined
  
  // Usar console apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    logFn(`[${level.toUpperCase()}] ${message}`, sanitizedContext)
  }
  
  // Em produção, poderia enviar para serviço de monitoramento (Sentry, etc.)
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    // TODO: Integrar com Sentry ou similar
    // Sentry.captureException(new Error(message), { contexts: { custom: sanitizedContext } })
  }
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  createErrorResponse,
  withErrorHandler,
  safeLog,
}
