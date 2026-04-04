/**
 * CAMADA: Utils
 * MÓDULO: Monitoring
 * RESPONSABILIDADE: Configuração de monitoramento e logging
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: Node.js
 */

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// Configuração do Sentry para monitoramento de erros
export function initMonitoring() {
  if (typeof window !== 'undefined') {
    // Client-side
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 1.0,
      beforeSend(event) {
        // Filtrar dados sensíveis
        if (event.exception) {
          const exception = event.exception.values?.[0]
          if (exception?.stacktrace) {
            // Remover informações sensíveis do stacktrace
            exception.stacktrace.frames = exception.stacktrace.frames?.map(frame => ({
              ...frame,
              vars: undefined // Remover variáveis locais
            }))
          }
        }
        return event
      }
    })
  }
}

// Logger estruturado para tracking
export class Logger {
  static info(message: string, context?: Record<string, any>) {
    // Log estruturado mantido para monitoramento em produção
    console.info(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }))
  }

  static warn(message: string, context?: Record<string, any>) {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      context,
      timestamp: new Date().toISOString()
    }))
  }

  static error(message: string, error?: Error, context?: Record<string, any>) {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context,
      timestamp: new Date().toISOString()
    }))

    // Enviar para Sentry em produção
    if (process.env.NODE_ENV === 'production' && error) {
      Sentry.captureException(error, {
        contexts: { custom: context }
      })
    }
  }

  static debug(message: string, context?: Record<string, any>) {
    // Debug mantido apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify({
        level: 'debug',
        message,
        context,
        timestamp: new Date().toISOString()
      }))
    }
  }
}

// Métricas de performance
export class Metrics {
  static trackApiCall(endpoint: string, method: string, duration: number, statusCode: number) {
    Logger.info('API Call', {
      endpoint,
      method,
      duration,
      statusCode,
      type: 'api_metric'
    })
  }

  static trackUserAction(action: string, userId?: string, context?: Record<string, any>) {
    Logger.info('User Action', {
      action,
      userId,
      context,
      type: 'user_metric'
    })
  }

  static trackError(error: Error, context?: Record<string, any>) {
    Logger.error('Application Error', error, {
      ...context,
      type: 'error_metric'
    })
  }

  static trackPerformance(name: string, duration: number, context?: Record<string, any>) {
    Logger.info('Performance Metric', {
      name,
      duration,
      context,
      type: 'performance_metric'
    })
  }
}

// Health check endpoint
export function createHealthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'connected', // TODO: Verificar conexão real
      cache: 'connected' // TODO: Verificar cache
    }
  }
}

// Middleware para tracking de requisições
export function createRequestTracker() {
  return (req: NextRequest, res: any, next: Function) => {
    const start = Date.now()
    const originalSend = res.send
    
    res.send = function(data: any) {
      const duration = Date.now() - start
      Metrics.trackApiCall(
        req.url || '',
        req.method || 'GET',
        duration,
        res.statusCode
      )
      return originalSend.call(this, data)
    }
    
    next()
  }
}

// Rate limiting tracking
export class RateLimiter {
  private requests = new Map<string, number[]>()
  private readonly windowMs: number
  private readonly maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    
    // Remover requisições antigas
    const validRequests = requests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      Metrics.trackError(new Error('Rate limit exceeded'), {
        identifier,
        requestCount: validRequests.length
      })
      return false
    }
    
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    return true
  }

  cleanup() {
    const now = Date.now()
    const keys = Array.from(this.requests.keys())
    
    for (const key of keys) {
      const requests = this.requests.get(key) || []
      const validRequests = requests.filter(time => now - time < this.windowMs)
      
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }
}

// Limpar rate limiter periodicamente
const rateLimiter = new RateLimiter()
setInterval(() => rateLimiter.cleanup(), 60000)
