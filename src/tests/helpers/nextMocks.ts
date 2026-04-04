/**
 * CAMADA: Test Helper
 * RESPONSABILIDADE: Mocks reutilizáveis do Next.js Request e Response
 * NÃO DEVE: Ser importado fora da pasta /tests
 */
import { NextRequest } from 'next/server'

export function createMockRequest(options: {
  method?: string
  body?: object
  headers?: Record<string, string>
  token?: string
}): NextRequest {
  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers
  })

  return new NextRequest('http://localhost:3001/api/test', {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  })
}

export function createMockRequestSemToken(): NextRequest {
  return new NextRequest('http://localhost:3001/api/test', {
    method: 'GET',
    headers: new Headers({ 'Content-Type': 'application/json' })
  })
}
