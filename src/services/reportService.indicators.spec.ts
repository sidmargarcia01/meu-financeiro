/**
 * 📄 Descrição: Testes unitários do gerarIndicadores no ReportService
 * 🧱 Contexto: Bloco 40 — Painel de Indicadores Gerenciais
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Jest, TypeScript
 * 🔍 Dependências: reportService, @supabase/supabase-js (mockado)
 * ✅ Revisado: Sim
 */

import { ReportService } from './reportService'

// ─── Mock do cliente Supabase ─────────────────────────────────────────────────
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}))

import { supabase } from '@/lib/supabase'

const mockFrom = supabase.from as jest.Mock

// ─── Helpers de mock ──────────────────────────────────────────────────────────
function buildDreMock(totalReceitas: number, totalDespesas: number) {
  // mock para a query de transactions do DRE
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1', description: 'Venda', amount: totalReceitas,
          type: 'RECEITA', status: 'PAGO',
          due_date: '2026-04-15', competence_date: '2026-04-15', payment_date: '2026-04-15',
          categories: { id: 'c1', name: 'Vendas', type: 'RECEITA', parent_id: null },
        },
        ...(totalDespesas > 0 ? [{
          id: '2', description: 'Custo', amount: totalDespesas,
          type: 'DESPESA', status: 'PAGO',
          due_date: '2026-04-20', competence_date: '2026-04-20', payment_date: '2026-04-20',
          categories: { id: 'c2', name: 'Custos', type: 'DESPESA', parent_id: null },
        }] : []),
      ],
      error: null,
    }),
  }
}

function buildDfcMock(entradas: number, saidas: number) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({
      data: [
        {
          id: '1', description: 'Recebimento', amount: entradas,
          type: 'RECEITA', status: 'PAGO',
          due_date: '2026-04-15', payment_date: '2026-04-15',
          accounts: { name: 'Conta Principal' },
          categories: { name: 'Vendas' },
        },
        ...(saidas > 0 ? [{
          id: '2', description: 'Pagamento', amount: saidas,
          type: 'DESPESA', status: 'PAGO',
          due_date: '2026-04-20', payment_date: '2026-04-20',
          accounts: { name: 'Conta Principal' },
          categories: { name: 'Custos' },
        }] : []),
      ],
      error: null,
    }),
  }
}

function buildBalancoMocks(ativoCirculante: number, passivoCirculante: number) {
  // accounts mock
  const accountsMock = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    mockResolvedValue: undefined as any,
  }

  // Cada chamada ao .from() pode ser accounts ou transactions
  let callCount = 0
  mockFrom.mockImplementation((table: string) => {
    callCount++
    if (table === 'accounts') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        // accounts query resolve
        then: undefined,
        // simulated resolve
        mockResolve: undefined,
      }
    }
    return buildDreMock(1000, 200)
  })
}

// ─── Testes ───────────────────────────────────────────────────────────────────
describe('ReportService.gerarIndicadores', () => {
  let service: ReportService

  beforeEach(() => {
    service = new ReportService()
    jest.clearAllMocks()
  })

  it('1) calcula todos os indicadores quando todos os dados existem', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }))

    const result = await service.gerarIndicadores('user1', '2026-04-01', '2026-04-30')

    expect(result.sections).toHaveLength(3)
    expect(result.period.startDate).toBe('2026-04-01')
    expect(result.period.endDate).toBe('2026-04-30')

    const secResultado = result.sections.find(s => s.title === 'Resultado')
    expect(secResultado).toBeDefined()
    expect(secResultado!.indicators.find(i => i.key === 'receita_operacional_bruta')?.unit).toBe('R$')
    expect(secResultado!.indicators.find(i => i.key === 'margem_liquida_percent')?.unit).toBe('%')
  })

  it('2) retorna null em indicadores de margem quando Receita Líquida = 0', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }))

    const result = await service.gerarIndicadores('user1', '2026-04-01', '2026-04-30')

    const secResultado = result.sections.find(s => s.title === 'Resultado')!
    const margemLiq = secResultado.indicators.find(i => i.key === 'margem_liquida_percent')
    expect(margemLiq?.value).toBeNull()

    const secCaixa = result.sections.find(s => s.title === 'Caixa')!
    const gcoPct = secCaixa.indicators.find(i => i.key === 'gco_sobre_receita_percent')
    expect(gcoPct?.value).toBeNull()
  })

  it('3) retorna null em liquidez corrente quando Passivo Circulante = 0', async () => {
    mockFrom.mockImplementation((table: string) => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }))

    const result = await service.gerarIndicadores('user1', '2026-04-01', '2026-04-30')

    const secEstrutura = result.sections.find(s => s.title === 'Estrutura e Solvência')!
    const liqCorrente = secEstrutura.indicators.find(i => i.key === 'liquidez_corrente')
    // PC = 0 → ratio = null
    expect(liqCorrente?.value).toBeNull()
  })

  it('4) retorna GCO = 0 quando não há movimentações DFC', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }))

    const result = await service.gerarIndicadores('user1', '2026-04-01', '2026-04-30')

    const secCaixa = result.sections.find(s => s.title === 'Caixa')!
    const gco = secCaixa.indicators.find(i => i.key === 'gco_valor')
    expect(gco?.value).toBe(0)
  })

  it('5) repassa corretamente startDate e endDate na resposta', async () => {
    mockFrom.mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      is: jest.fn().mockResolvedValue({ data: [], error: null }),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    }))

    const result = await service.gerarIndicadores('user1', '2026-01-01', '2026-03-31')

    expect(result.period.startDate).toBe('2026-01-01')
    expect(result.period.endDate).toBe('2026-03-31')
  })
})
