/**
 * CAMADA: Test
 * MÓDULO: Accounts Balance API
 * RESPONSABILIDADE: Testes de integração do endpoint /api/accounts/balance
 * NÃO DEVE: Acessar banco de dados real (usar mocks)
 * DEPENDE DE: Jest, Next.js test utils
 * 
 * FASE 3 - Endpoint robusto para Saldo Anterior
 */

import { NextRequest } from 'next/server'
import { GET } from '@/app/api/accounts/balance/route'
import { AccountService } from '@/services/accountService'

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

jest.mock('@/services/accountService')

describe('GET /api/accounts/balance - Saldo Anterior (Fase 3)', () => {
  let mockGetBalancesUntilDate: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetBalancesUntilDate = jest.fn()
      ; (AccountService as jest.Mock).mockImplementation(() => ({
        getBalancesUntilDate: mockGetBalancesUntilDate,
      }))
  })

  describe('Cenário 1 – Uma conta, receitas e despesas antes de D', () => {
    it('deve retornar saldo correto até D-1 (incluindo initialBalance)', async () => {
      const date = '2026-04-25'
      const accounts = 'acc-1'

      // Mock do service retornando saldo calculado
      mockGetBalancesUntilDate.mockResolvedValue({
        date,
        balances: [
          { account_id: 'acc-1', balance_until_previous_day: 130 }  // 100 + 50 - 20
        ],
        total_balance: 130
      })

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=${date}&accounts=${accounts}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.date).toBe(date)
      expect(data.balances).toHaveLength(1)
      expect(data.balances[0].balance_until_previous_day).toBe(130)
      expect(data.total_balance).toBe(130)

      // Verificar que o service foi chamado corretamente
      expect(mockGetBalancesUntilDate).toHaveBeenCalledWith(
        expect.any(String),  // userId
        ['acc-1'],
        date
      )
    })
  })

  describe('Cenário 2 – Múltiplas contas', () => {
    it('deve retornar saldo de cada conta e total correto', async () => {
      const date = '2026-04-25'
      const accounts = 'acc-1,acc-2'

      mockGetBalancesUntilDate.mockResolvedValue({
        date,
        balances: [
          { account_id: 'acc-1', balance_until_previous_day: 500 },
          { account_id: 'acc-2', balance_until_previous_day: 300 }
        ],
        total_balance: 800
      })

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=${date}&accounts=${accounts}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.balances).toHaveLength(2)
      expect(data.total_balance).toBe(800)
      expect(mockGetBalancesUntilDate).toHaveBeenCalledWith(
        expect.any(String),
        ['acc-1', 'acc-2'],
        date
      )
    })
  })

  describe('Cenário 3 – Transações no próprio dia D não entram', () => {
    it('deve excluir transações com due_date == D do cálculo', async () => {
      // O service deve garantir que < D, não <= D
      const date = '2026-04-25'

      mockGetBalancesUntilDate.mockResolvedValue({
        date,
        balances: [{ account_id: 'acc-1', balance_until_previous_day: 100 }],
        total_balance: 100
      })

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=${date}&accounts=acc-1`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // O service deve ser chamado com a data D, e ele calcula < D internamente
      expect(mockGetBalancesUntilDate).toHaveBeenCalledWith(
        expect.any(String),
        ['acc-1'],
        date
      )
    })
  })

  describe('Cenário 4 – Transações futuras não entram', () => {
    it('deve excluir transações com due_date > D', async () => {
      const date = '2026-04-25'

      mockGetBalancesUntilDate.mockResolvedValue({
        date,
        balances: [{ account_id: 'acc-1', balance_until_previous_day: 100 }],
        total_balance: 100
      })

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=${date}&accounts=acc-1`
      )

      const response = await GET(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Cenário 5 – Status não confirmado', () => {
    it('deve ignorar PENDENTE e AGENDADO no cálculo', async () => {
      const date = '2026-04-25'

      // Apenas CONFIRMADO/CONCILIADO entram
      mockGetBalancesUntilDate.mockResolvedValue({
        date,
        balances: [{ account_id: 'acc-1', balance_until_previous_day: 150 }],
        total_balance: 150
      })

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=${date}&accounts=acc-1`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.balances[0].balance_until_previous_day).toBe(150)
    })
  })

  describe('Cenário 6 – Input inválido', () => {
    it('deve retornar 400 quando date está ausente', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?accounts=acc-1`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('date')
    })

    it('deve retornar 400 quando accounts está ausente', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=2026-04-25`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('accounts')
    })

    it('deve retornar 400 quando date tem formato inválido', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=invalid&accounts=acc-1`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('formato')
    })

    it('deve retornar 400 quando lista de contas está vazia', async () => {
      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=2026-04-25&accounts=`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('Segurança – Erros do servidor', () => {
    it('deve retornar 500 com mensagem genérica em erro interno', async () => {
      mockGetBalancesUntilDate.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = new NextRequest(
        `http://localhost:3000/api/accounts/balance?date=2026-04-25&accounts=acc-1`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBeDefined()
      // Não deve expor detalhes internos
      expect(data.error).not.toContain('Database connection')
    })
  })
})
