/**
 * CAMADA: Test - Service
 * MÓDULO: Dashboard
 * RESPONSABILIDADE: Testar agregação de dados para o dashboard
 * NÃO DEVE: Testar componentes React ou API routes
 * DEPENDE DE: dashboardService, mocks dos repositories
 */

import { dashboardService } from '@/services/dashboardService'
import { accountRepository } from '@/repositories/accountRepository'
import { transactionRepository } from '@/repositories/transactionRepository'

jest.mock('@/repositories/accountRepository')
jest.mock('@/repositories/transactionRepository')

// Mock implementations
const mockAccountRepository = accountRepository as jest.Mocked<typeof accountRepository>
const mockTransactionRepository = transactionRepository as jest.Mocked<typeof transactionRepository>

const mockAccounts = [
  {
    id: 'acc-1',
    name: 'Conta Corrente',
    type: 'CORRENTE',
    initial_balance: 1000.00,
    is_active: true,
    currency: 'BRL'
  },
  {
    id: 'acc-2',
    name: 'Poupança',
    type: 'POUPANCA',
    initial_balance: 5000.00,
    is_active: true,
    currency: 'BRL'
  }
]

const mockTransactionSums = {
  projected: 2500.00,
  confirmed: 1800.00
}

// Mock para sumByAccount que retorna number
const mockSumByAccount = (accountId: string, statusFilter?: string[]) => {
  if (statusFilter && statusFilter.length > 0) {
    return mockTransactionSums.confirmed
  }
  return mockTransactionSums.projected
}

describe('dashboardService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ─── WIDGET 1: SALDO CONSOLIDADO ───────────────────────────────────────────

  describe('getSaldoConsolidado', () => {
    it('deve somar saldo projetado de todas as contas ativas', async () => {
      mockAccountRepository.findAllByUser.mockResolvedValue(mockAccounts)
      mockTransactionRepository.sumByAccount.mockImplementation(mockSumByAccount)

      const result = await dashboardService.getSaldoConsolidado('user-id')

      expect(result.total_projetado).toBeDefined()
      expect(result.total_confirmado).toBeDefined()
      expect(result.por_conta).toHaveLength(2)
    })

    it('deve retornar saldo zerado quando usuário não tem contas', async () => {
      mockAccountRepository.findAllByUser.mockResolvedValue([])

      const result = await dashboardService.getSaldoConsolidado('user-id')

      expect(result.total_projetado).toBe(0)
      expect(result.total_confirmado).toBe(0)
      expect(result.por_conta).toHaveLength(0)
    })

    it('deve incluir saldo por conta individualmente', async () => {
      mockAccountRepository.findAllByUser.mockResolvedValue(mockAccounts)
      mockTransactionRepository.sumByAccount.mockImplementation(mockSumByAccount)

      const result = await dashboardService.getSaldoConsolidado('user-id')

      expect(result.por_conta[0]).toHaveProperty('account_id')
      expect(result.por_conta[0]).toHaveProperty('account_name')
      expect(result.por_conta[0]).toHaveProperty('projetado')
      expect(result.por_conta[0]).toHaveProperty('confirmado')
      expect(result.por_conta[0]).toHaveProperty('currency')
    })

    it('deve ignorar contas arquivadas (is_active = false)', async () => {
      const contasComArquivada = [
        ...mockAccounts,
        { id: 'acc-3', name: 'Arquivada', is_active: false, initial_balance: 999 }
      ]
      mockAccountRepository.findAllByUser.mockResolvedValue(
        contasComArquivada.filter(a => a.is_active)
      )
      mockTransactionRepository.sumByAccount.mockImplementation(mockSumByAccount)

      const result = await dashboardService.getSaldoConsolidado('user-id')
      expect(result.por_conta).toHaveLength(2)
    })
  })

  // ─── WIDGET 2: RESUMO MENSAL ──────────────────────────────────────────────

  describe('getResumoMensal', () => {
    it('deve retornar total de receitas e despesas do mês corrente', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 8500.00,
        despesas: 3200.00,
        mes: 4,
        ano: 2026
      })

      const result = await dashboardService.getResumoMensal('user-id', 4, 2026)

      expect(result.receitas).toBe(8500.00)
      expect(result.despesas).toBe(3200.00)
      expect(result.saldo).toBe(5300.00)
    })

    it('deve calcular saldo como receitas menos despesas', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 5000.00,
        despesas: 7000.00
      })

      const result = await dashboardService.getResumoMensal('user-id', 4, 2026)

      expect(result.saldo).toBe(-2000.00)
    })

    it('deve incluir comparativo com mês anterior', async () => {
      mockTransactionRepository.getMonthlySummary
        .mockResolvedValueOnce({ receitas: 8500.00, despesas: 3200.00 })
        .mockResolvedValueOnce({ receitas: 7000.00, despesas: 4000.00 })

      const result = await dashboardService.getResumoMensal('user-id', 4, 2026)

      expect(result.comparativo).toBeDefined()
      expect(result.comparativo.variacao_receitas).toBeDefined()
      expect(result.comparativo.variacao_despesas).toBeDefined()
    })

    it('deve usar mês e ano correntes quando não informados', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 0, despesas: 0
      })

      const agora = new Date()
      const result = await dashboardService.getResumoMensal('user-id')

      expect(mockTransactionRepository.getMonthlySummary).toHaveBeenCalledWith(
        'user-id',
        agora.getMonth() + 1,
        agora.getFullYear()
      )
    })
  })

  // ─── WIDGET 3: FLUXO DE CAIXA ────────────────────────────────────────────

  describe('getFluxoCaixa', () => {
    it('deve retornar entradas e saídas dos últimos 6 meses', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 5000,
        despesas: 3000
      })

      const result = await dashboardService.getFluxoCaixa('user-id')

      expect(result.meses).toHaveLength(6)
      expect(result.meses[0]).toHaveProperty('mes')
      expect(result.meses[0]).toHaveProperty('ano')
      expect(result.meses[0]).toHaveProperty('receitas')
      expect(result.meses[0]).toHaveProperty('despesas')
      expect(result.meses[0]).toHaveProperty('saldo')
    })

    it('deve ordenar os meses do mais antigo para o mais recente', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 0, despesas: 0
      })

      const result = await dashboardService.getFluxoCaixa('user-id')
      const meses = result.meses

      for (let i = 1; i < meses.length; i++) {
        const anterior = new Date(meses[i-1].ano, meses[i-1].mes - 1)
        const atual = new Date(meses[i].ano, meses[i].mes - 1)
        expect(atual.getTime()).toBeGreaterThan(anterior.getTime())
      }
    })

    it('deve aceitar período customizado de meses', async () => {
      mockTransactionRepository.getMonthlySummary.mockResolvedValue({
        receitas: 0, despesas: 0
      })

      const result = await dashboardService.getFluxoCaixa('user-id', 12)
      expect(result.meses).toHaveLength(12)
    })
  })

  // ─── WIDGET 4: LANÇAMENTOS PRÓXIMOS ──────────────────────────────────────

  describe('getLancamentosProximos', () => {
    it('deve retornar lançamentos com vencimento nos próximos 7 dias', async () => {
      const hoje = new Date()
      const amanha = new Date(hoje)
      amanha.setDate(amanha.getDate() + 1)

      mockTransactionRepository.findUpcoming.mockResolvedValue([
        {
          id: 'tx-1',
          description: 'Aluguel',
          amount: 1500.00,
          dueDate: amanha.toISOString().split('T')[0],
          status: 'PENDENTE',
          type: 'DESPESA'
        }
      ])

      const result = await dashboardService.getLancamentosProximos('user-id')

      expect(result.proximos_7_dias).toBeDefined()
      expect(result.vencidos).toBeDefined()
    })

    it('deve separar lançamentos vencidos dos próximos', async () => {
      const ontem = new Date()
      ontem.setDate(ontem.getDate() - 1)
      const amanha = new Date()
      amanha.setDate(amanha.getDate() + 1)

      mockTransactionRepository.findUpcoming.mockResolvedValue([
        { id: 'tx-1', dueDate: ontem.toISOString().split('T')[0], status: 'PENDENTE' },
        { id: 'tx-2', dueDate: amanha.toISOString().split('T')[0], status: 'PENDENTE' }
      ])

      const result = await dashboardService.getLancamentosProximos('user-id')

      expect(result.vencidos).toHaveLength(1)
      expect(result.proximos_7_dias).toHaveLength(1)
    })

    it('deve retornar apenas lançamentos PENDENTES (não os já pagos)', async () => {
      mockTransactionRepository.findUpcoming.mockResolvedValue([])

      await dashboardService.getLancamentosProximos('user-id')

      expect(mockTransactionRepository.findUpcoming).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ status: 'PENDENTE' })
      )
    })
  })

  // ─── WIDGET 5: DISTRIBUIÇÃO POR CATEGORIA ────────────────────────────────

  describe('getDistribuicaoCategorias', () => {
    it('deve retornar as maiores categorias de despesa do mês', async () => {
      mockTransactionRepository.sumByCategory.mockResolvedValue([
        { category_id: 'cat-1', category_name: 'Alimentação', total: 1200.00 },
        { category_id: 'cat-2', category_name: 'Transporte', total: 800.00 },
        { category_id: 'cat-3', category_name: 'Lazer', total: 450.00 }
      ])

      const result = await dashboardService.getDistribuicaoCategorias('user-id', 4, 2026)

      expect(result.categorias).toHaveLength(3)
      expect(result.categorias[0]).toHaveProperty('category_name')
      expect(result.categorias[0]).toHaveProperty('total')
      expect(result.categorias[0]).toHaveProperty('percentual')
      expect(result.total_despesas).toBe(2450.00)
    })

    it('deve calcular percentual de cada categoria sobre o total', async () => {
      mockTransactionRepository.sumByCategory.mockResolvedValue([
        { category_id: 'cat-1', category_name: 'Alimentação', total: 1000.00 },
        { category_id: 'cat-2', category_name: 'Transporte', total: 1000.00 }
      ])

      const result = await dashboardService.getDistribuicaoCategorias('user-id', 4, 2026)

      expect(result.categorias[0].percentual).toBe(50)
      expect(result.categorias[1].percentual).toBe(50)
    })

    it('deve retornar apenas tipo DESPESA', async () => {
      mockTransactionRepository.sumByCategory.mockResolvedValue([])

      await dashboardService.getDistribuicaoCategorias('user-id', 4, 2026)

      expect(mockTransactionRepository.sumByCategory).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ type: 'DESPESA' })
      )
    })
  })

  // ─── SEGURANÇA ────────────────────────────────────────────────────────────

  describe('Segurança', () => {
    it('não deve retornar dados de outro usuário', async () => {
      mockAccountRepository.findAllByUser.mockResolvedValue([])

      await dashboardService.getSaldoConsolidado('user-id-correto')

      expect(mockAccountRepository.findAllByUser).toHaveBeenCalledWith(
        'user-id-correto',
        expect.anything()
      )
      expect(mockAccountRepository.findAllByUser).not.toHaveBeenCalledWith(
        'outro-user-id',
        expect.anything()
      )
    })
  })
})
