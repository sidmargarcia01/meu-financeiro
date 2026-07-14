/**
 * CAMADA: Test
 * MÓDULO: Fluxo Gerencial API
 * RESPONSABILIDADE: Testes de integração do endpoint /api/reports/fluxo-gerencial
 * NÃO DEVE: Acessar banco de dados real (usar mocks)
 * DEPENDE DE: Jest, Next.js test utils
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/reports/fluxo-gerencial/route'
import { fluxoGerencialService } from '@/services/fluxoGerencialService'

jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string
    nextUrl: URL
    cookies: { get: () => undefined }
    constructor(url: string) {
      this.url = url
      this.nextUrl = new URL(url)
      this.cookies = { get: () => undefined }
    }
  },
  NextResponse: {
    json: (body: any, init?: any) => ({
      status: init?.status ?? 200,
      json: async () => body,
    }),
    redirect: jest.fn(),
  },
}))

jest.mock('@/middlewares/auth', () => ({
  withAuth: (request: any, handler: any) =>
    handler(request, { id: 'test-user-id', email: 'test@test.com' }),
}))

jest.mock('@/services/fluxoGerencialService')

const mockGerarMatriz = fluxoGerencialService.gerarMatriz as jest.MockedFunction<typeof fluxoGerencialService.gerarMatriz>

describe('GET /api/reports/fluxo-gerencial', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar 200 com os dados da matriz', async () => {
    mockGerarMatriz.mockResolvedValue({
      periodo: { inicio: '2026-01-01', fim: '2026-01-31' },
      regime: 'CAIXA',
      meses: [{ mes: 1, ano: 2026 }],
      linhas: [
        {
          id: 'receita_faturamento',
          label: 'RECEITA/FATURAMENTO',
          tipo: 'grupo',
          nivel: 0,
          destaque: false,
          avTipo: 'receita',
          valores: [{ realizado: 10000, av: 100, ah: null }],
        },
      ],
    })

    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?inicio=2026-01-01&fim=2026-01-31&regime=CAIXA'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.meses).toHaveLength(1)
    expect(data.linhas).toHaveLength(1)
    expect(mockGerarMatriz).toHaveBeenCalledWith('test-user-id', '2026-01-01', '2026-01-31', 'CAIXA')
  })

  it('deve retornar 400 quando inicio está ausente', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?fim=2026-01-31'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Parâmetros inválidos')
  })

  it('deve retornar 400 quando formato de data é inválido', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?inicio=01-01-2026&fim=2026-01-31'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Parâmetros inválidos')
  })

  it('deve retornar 400 quando inicio é posterior a fim', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?inicio=2026-12-01&fim=2026-01-31'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('início deve ser anterior')
  })

  it('deve retornar 400 quando período excede 24 meses', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?inicio=2024-01-01&fim=2026-06-30'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('24 meses')
  })

  it('deve retornar 500 em erro interno do service', async () => {
    mockGerarMatriz.mockRejectedValue(new Error('Database connection failed'))

    const request = new NextRequest(
      'http://localhost:3000/api/reports/fluxo-gerencial?inicio=2026-01-01&fim=2026-01-31'
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
    expect(data.error).not.toContain('Database connection')
  })
})
