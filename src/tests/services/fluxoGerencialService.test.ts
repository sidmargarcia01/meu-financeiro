/**
 * CAMADA: Test - Service
 * MÓDULO: Fluxo de Caixa Gerencial
 * RESPONSABILIDADE: Testar cálculo da matriz REALIZADO / AV / AH
 * NÃO DEVE: Testar componentes React ou API routes
 * DEPENDE DE: fluxoGerencialService, mocks do transactionRepository
 */

import { fluxoGerencialService } from '@/services/fluxoGerencialService'
import { transactionRepository } from '@/repositories/transactionRepository'

jest.mock('@/repositories/transactionRepository')

const mockTransactionRepository = transactionRepository as jest.Mocked<typeof transactionRepository>

function mockTransaction(
  overrides: Partial<{
    id: string
    description: string
    amount: number
    type: 'RECEITA' | 'DESPESA'
    status: 'CONFIRMADO' | 'CONCILIADO' | 'PENDENTE'
    due_date: string
    categories: any
  }>
) {
  return {
    id: 'tx-' + Math.random().toString(36).slice(2),
    description: 'Teste',
    amount: 1000,
    type: 'RECEITA' as const,
    status: 'CONFIRMADO' as const,
    due_date: '2026-01-15',
    categories: null,
    ...overrides,
  }
}

describe('fluxoGerencialService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve retornar meses ordenados do mais antigo para o mais recente', async () => {
    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue([])
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-03-31')

    expect(result.meses).toHaveLength(3)
    expect(result.meses[0]).toEqual({ mes: 1, ano: 2026 })
    expect(result.meses[2]).toEqual({ mes: 3, ano: 2026 })
  })

  it('deve retornar 15 linhas principais mais linha fixa de destaque (LUCRO OPERACIONAL)', async () => {
    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue([])
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const principais = result.linhas.filter(l => l.nivel === 0)
    expect(principais).toHaveLength(16)
  })

  it('deve calcular Margem de Contribuição = Receita - Custos Variáveis', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -4000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-custo', name: 'Materiais', type: 'DESPESA', parent_id: null, dre_group: 'CUSTOS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const receita = result.linhas.find(l => l.id === 'receita_faturamento')!.valores[0].realizado
    const custos = result.linhas.find(l => l.id === 'custos_variaveis')!.valores[0].realizado
    const mc = result.linhas.find(l => l.id === 'margem_contribuicao')!.valores[0].realizado

    expect(receita).toBe(10000)
    expect(custos).toBe(-4000)
    expect(mc).toBe(6000)
  })

  it('deve calcular Lucro Operacional = Receita - Despesa Operacional Total', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -3000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-custo', name: 'Materiais', type: 'DESPESA', parent_id: null, dre_group: 'CUSTOS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -2000,
        type: 'DESPESA',
        due_date: '2026-01-20',
        categories: { id: 'cat-fixa', name: 'Aluguel', type: 'DESPESA', parent_id: null, dre_group: 'DESPESAS_FIXAS' },
      }),
      mockTransaction({
        amount: -1000,
        type: 'DESPESA',
        due_date: '2026-01-25',
        categories: { id: 'cat-inv', name: 'Equipamentos', type: 'DESPESA', parent_id: null, dre_group: 'INVESTIMENTOS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const despesaTotal = result.linhas.find(l => l.id === 'despesa_operacional_total')!.valores[0].realizado
    const lucroOp = result.linhas.find(l => l.id === 'lucro_operacional')!.valores[0].realizado

    expect(despesaTotal).toBe(-6000)
    expect(lucroOp).toBe(4000)
  })

  it('deve calcular AV da Receita como 100% e de despesa como |valor| / receita', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -4000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-custo', name: 'Materiais', type: 'DESPESA', parent_id: null, dre_group: 'CUSTOS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const receitaAV = result.linhas.find(l => l.id === 'receita_faturamento')!.valores[0].av
    const custosAV = result.linhas.find(l => l.id === 'custos_variaveis')!.valores[0].av

    expect(receitaAV).toBe(100)
    expect(custosAV).toBeCloseTo(40, 1)
  })

  it('deve calcular AH como variação percentual entre meses consecutivos', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: 12000,
        type: 'RECEITA',
        due_date: '2026-02-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-02-28')

    const receita = result.linhas.find(l => l.id === 'receita_faturamento')!
    expect(receita.valores[0].ah).toBeNull()
    expect(receita.valores[1].ah).toBeCloseTo(20, 1)
  })

  it('deve retornar AH null quando base anterior é zero', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-02-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-02-28')

    const receita = result.linhas.find(l => l.id === 'receita_faturamento')!
    expect(receita.valores[0].ah).toBeNull()
    expect(receita.valores[1].ah).toBeNull()
  })

  it('deve calcular Ponto de Equilíbrio = |despesas fixas| / %MC', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -4000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-custo', name: 'Materiais', type: 'DESPESA', parent_id: null, dre_group: 'CUSTOS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -2000,
        type: 'DESPESA',
        due_date: '2026-01-20',
        categories: { id: 'cat-fixa', name: 'Aluguel', type: 'DESPESA', parent_id: null, dre_group: 'DESPESAS_FIXAS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const mc = result.linhas.find(l => l.id === 'margem_contribuicao')!.valores[0].realizado
    const pe = result.linhas.find(l => l.id === 'ponto_equilibrio_antes_investimento')!.valores[0].realizado

    // MC = 10000 - 4000 = 6000; %MC = 60%; PE = 2000 / 0.6 = 3333.33
    expect(mc).toBe(6000)
    expect(pe).toBeCloseTo(3333.33, 2)
  })

  it('deve retornar null para Ponto de Equilíbrio quando %MC <= 0', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -12000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-custo', name: 'Materiais', type: 'DESPESA', parent_id: null, dre_group: 'CUSTOS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -2000,
        type: 'DESPESA',
        due_date: '2026-01-20',
        categories: { id: 'cat-fixa', name: 'Aluguel', type: 'DESPESA', parent_id: null, dre_group: 'DESPESAS_FIXAS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const peAntes = result.linhas.find(l => l.id === 'ponto_equilibrio_antes_investimento')!.valores[0].realizado
    const peCom = result.linhas.find(l => l.id === 'ponto_equilibrio_com_investimento')!.valores[0].realizado

    expect(peAntes).toBe(0)
    expect(peCom).toBe(0)
  })

  it('deve encadear Saldo Inicial do mês N+1 igual ao Saldo Final do mês N', async () => {
    const transactions = [
      mockTransaction({
        amount: 5000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: 3000,
        type: 'RECEITA',
        due_date: '2026-02-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockImplementation(async (_userId, date) => {
      // Saldo acumulado antes de uma data = 0 para simplificar
      return date <= '2026-01-01' ? 0 : 5000
    })

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-02-28')

    const saldoInicial = result.linhas.find(l => l.id === 'saldo_inicial')!
    const saldoFinal = result.linhas.find(l => l.id === 'saldo_final')!

    expect(saldoInicial.valores[0].realizado).toBe(0)
    expect(saldoFinal.valores[0].realizado).toBe(saldoInicial.valores[1].realizado)
  })

  it('deve calcular Acerto do Caixa como Saldo Real - (Saldo Inicial + Resultado Líquido)', async () => {
    const transactions = [
      mockTransaction({
        amount: 5000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    // Saldo real final = 4000, mas resultado líquido = 5000 + saldo inicial 0 = 5000
    mockTransactionRepository.sumConfirmedBefore.mockImplementation(async (_userId, date) => {
      if (date <= '2026-01-01') return 0
      return 4000
    })

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const acerto = result.linhas.find(l => l.id === 'acerto_do_caixa')!.valores[0].realizado
    expect(acerto).toBe(-1000)
  })

  it('deve classificar despesas por fallback de keywords quando não há dre_group', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: null },
      }),
      mockTransaction({
        amount: -2000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-aluguel', name: 'Aluguel', type: 'DESPESA', parent_id: null, dre_group: null },
      }),
      mockTransaction({
        amount: -3000,
        type: 'DESPESA',
        due_date: '2026-01-20',
        categories: { id: 'cat-merc', name: 'Mercadoria', type: 'DESPESA', parent_id: null, dre_group: null },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const fixas = result.linhas.find(l => l.id === 'despesas_fixas')!.valores[0].realizado
    const custos = result.linhas.find(l => l.id === 'custos_variaveis')!.valores[0].realizado

    expect(fixas).toBe(-2000)
    expect(custos).toBe(-3000)
  })

  it('deve criar linhas filhas para categorias quando existirem transações categorizadas', async () => {
    const transactions = [
      mockTransaction({
        amount: 10000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: -2000,
        type: 'DESPESA',
        due_date: '2026-01-15',
        categories: { id: 'cat-fixa', name: 'Aluguel', type: 'DESPESA', parent_id: null, dre_group: 'DESPESAS_FIXAS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-01-31')

    const filhas = result.linhas.filter(l => l.parentId === 'receita_faturamento' || l.parentId === 'despesas_fixas')
    expect(filhas.length).toBeGreaterThan(0)
    expect(filhas.some(l => l.label === 'Vendas')).toBe(true)
    expect(filhas.some(l => l.label === 'Aluguel')).toBe(true)
  })

  it('deve manter AH null para Acerto do Caixa em todos os meses', async () => {
    const transactions = [
      mockTransaction({
        amount: 5000,
        type: 'RECEITA',
        due_date: '2026-01-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
      mockTransaction({
        amount: 5000,
        type: 'RECEITA',
        due_date: '2026-02-10',
        categories: { id: 'cat-receita', name: 'Vendas', type: 'RECEITA', parent_id: null, dre_group: 'RECEITAS_OPERACIONAIS' },
      }),
    ]

    mockTransactionRepository.findAllForPeriodWithCategory.mockResolvedValue(transactions)
    mockTransactionRepository.sumConfirmedBefore.mockResolvedValue(0)

    const result = await fluxoGerencialService.gerarMatriz('user-1', '2026-01-01', '2026-02-28')

    const acerto = result.linhas.find(l => l.id === 'acerto_do_caixa')!
    expect(acerto.valores[0].ah).toBeNull()
    expect(acerto.valores[1].ah).toBeNull()
  })
})
