/**
 * CAMADA: Test
 * MÓDULO: AccountService - getBalancesUntilDate (Fase 3)
 * RESPONSABILIDADE: Testes unitários do cálculo de saldo anterior
 * NÃO DEVE: Acessar banco de dados real
 * DEPENDE DE: Jest, mocks de repositories
 * 
 * FASE 3 - Saldo Anterior robusto via backend
 */

import { AccountService } from '@/services/accountService'

// Mocks manuais (padrão do projeto)
const mockAccountRepository = {
  list: jest.fn()
}

const mockTransactionRepository = {
  list: jest.fn()
}

const mockUserRepository = {
  getUserPlan: jest.fn()
}

describe('AccountService.getBalancesUntilDate - Fase 3 (Saldo Anterior)', () => {
  let service: AccountService

  beforeEach(() => {
    jest.resetAllMocks()
    service = new AccountService(
      mockAccountRepository as any,
      mockTransactionRepository as any,
      mockUserRepository as any
    )
  })

  describe('Cenário 1 – Uma conta, receitas e despesas antes de D', () => {
    it('deve calcular saldo correto até D-1 (incluindo initialBalance)', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      // Mock: conta com initialBalance = 100
      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta Corrente', initialBalance: 100 }
      ])

      // Mock: transações até D
      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 50, due_date: '2026-04-20' },
        { id: 'tx-2', type: 'DESPESA', status: 'CONFIRMADO', amount: 20, due_date: '2026-04-23' }
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // Saldo esperado: 100 + 50 - 20 = 130
      expect(result.date).toBe(date)
      expect(result.balances).toHaveLength(1)
      expect(result.balances[0].account_id).toBe('acc-1')
      expect(result.balances[0].balance_until_previous_day).toBe(130)
      expect(result.total_balance).toBe(130)

      // Verificar chamada ao repository
      expect(mockTransactionRepository.list).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          accountId: 'acc-1',
          endDate: date
        })
      )
    })
  })

  describe('Cenário 2 – Múltiplas contas', () => {
    it('deve retornar saldo de cada conta e total correto', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1', 'acc-2']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta A', initialBalance: 200 },
        { id: 'acc-2', name: 'Conta B', initialBalance: 300 }
      ])

      // acc-1: 200 + 100 = 300
      mockTransactionRepository.list.mockImplementation((uid, filters) => {
        if (filters.accountId === 'acc-1') {
          return Promise.resolve([
            { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 100, due_date: '2026-04-20' }
          ])
        }
        // acc-2: 300 - 50 = 250
        return Promise.resolve([
          { id: 'tx-2', type: 'DESPESA', status: 'CONFIRMADO', amount: 50, due_date: '2026-04-22' }
        ])
      })

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      expect(result.balances).toHaveLength(2)
      expect(result.balances[0].balance_until_previous_day).toBe(300)
      expect(result.balances[1].balance_until_previous_day).toBe(250)
      expect(result.total_balance).toBe(550)  // 300 + 250
    })
  })

  describe('Cenário 3 – Transações no próprio dia D não entram', () => {
    it('deve excluir transações com due_date == D do cálculo', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta', initialBalance: 100 }
      ])

      // Transação EM D não deve entrar (due_date == date)
      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 50, due_date: '2026-04-25' },
        { id: 'tx-2', type: 'RECEITA', status: 'CONFIRMADO', amount: 30, due_date: '2026-04-24' }
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // Só tx-2 entra (due_date < D): 100 + 30 = 130
      expect(result.balances[0].balance_until_previous_day).toBe(130)
    })
  })

  describe('Cenário 4 – Transações futuras não entram', () => {
    it('deve excluir transações com due_date > D', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta', initialBalance: 100 }
      ])

      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 50, due_date: '2026-04-20' },
        { id: 'tx-2', type: 'RECEITA', status: 'CONFIRMADO', amount: 200, due_date: '2026-04-30' }  // Futuro
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // Só tx-1 entra (due_date < D): 100 + 50 = 150
      expect(result.balances[0].balance_until_previous_day).toBe(150)
    })
  })

  describe('Cenário 5 – Status não confirmado', () => {
    it('deve ignorar PENDENTE e AGENDADO no cálculo', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta', initialBalance: 100 }
      ])

      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'PENDENTE', amount: 100, due_date: '2026-04-20' },
        { id: 'tx-2', type: 'DESPESA', status: 'AGENDADO', amount: 50, due_date: '2026-04-21' },
        { id: 'tx-3', type: 'RECEITA', status: 'CONFIRMADO', amount: 30, due_date: '2026-04-22' },
        { id: 'tx-4', type: 'RECEITA', status: 'CONCILIADO', amount: 20, due_date: '2026-04-23' }
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // Só CONFIRMADO + CONCILIADO: 100 + 30 + 20 = 150
      expect(result.balances[0].balance_until_previous_day).toBe(150)
    })
  })

  describe('Cenário 6 – Input inválido', () => {
    it('deve lançar erro quando date está ausente', async () => {
      await expect(
        service.getBalancesUntilDate('user-1', ['acc-1'], '')
      ).rejects.toThrow('formato')
    })

    it('deve lançar erro quando date tem formato inválido', async () => {
      await expect(
        service.getBalancesUntilDate('user-1', ['acc-1'], 'invalid-date')
      ).rejects.toThrow('formato')
    })

    it('deve lançar erro quando lista de contas está vazia', async () => {
      await expect(
        service.getBalancesUntilDate('user-1', [], '2026-04-25')
      ).rejects.toThrow('conta')
    })

    it('deve lançar erro quando nenhuma conta válida é encontrada', async () => {
      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-2', name: 'Outra Conta', initialBalance: 100 }
      ])

      await expect(
        service.getBalancesUntilDate('user-1', ['acc-1'], '2026-04-25')
      ).rejects.toThrow('Nenhuma conta válida')
    })
  })

  describe('Segurança – Robustez', () => {
    it('deve lidar com amount negativo usando Math.abs', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta', initialBalance: 100 }
      ])

      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: -50, due_date: '2026-04-20' },
        { id: 'tx-2', type: 'DESPESA', status: 'CONFIRMADO', amount: -30, due_date: '2026-04-21' }
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // Math.abs garante valores positivos: 100 + 50 - 30 = 120
      expect(result.balances[0].balance_until_previous_day).toBe(120)
    })

    it('deve lidar com transações sem amount (undefined/null)', async () => {
      const userId = 'user-1'
      const accountIds = ['acc-1']
      const date = '2026-04-25'

      mockAccountRepository.list.mockResolvedValue([
        { id: 'acc-1', name: 'Conta', initialBalance: 100 }
      ])

      mockTransactionRepository.list.mockResolvedValue([
        { id: 'tx-1', type: 'RECEITA', status: 'CONFIRMADO', amount: undefined, due_date: '2026-04-20' },
        { id: 'tx-2', type: 'RECEITA', status: 'CONFIRMADO', amount: 50, due_date: '2026-04-21' }
      ])

      const result = await service.getBalancesUntilDate(userId, accountIds, date)

      // tx-1 sem amount deve ser tratado como 0: 100 + 0 + 50 = 150
      expect(result.balances[0].balance_until_previous_day).toBe(150)
    })
  })
})
