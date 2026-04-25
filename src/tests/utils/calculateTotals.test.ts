/**
 * CAMADA: Test
 * MÓDULO: calculateTotals
 * RESPONSABILIDADE: Testes unitários do cálculo de totais da tela de lançamentos
 * NÃO DEVE: Depender de UI, backend ou estado global
 * DEPENDE DE: Jest, função pura calculateTotals
 * 
 * Regra de negócio:
 * - Resultados (R$) deve considerar todas as transações até a data selecionada D (inclusive)
 * - Ou seja, due_date <= selectedDateStr
 * 
 * FASE 1 - Refatoração de critério de data
 */

import { calculateTotals, Transaction, Account } from '@/utils/calculateTotals'

describe('calculateTotals - Fase 1: Critério de data (due_date <= D)', () => {
  // Dados base para reuso
  const accounts: Account[] = [
    { id: 'acc-1', initialBalance: 1000 },
    { id: 'acc-2', initialBalance: 500 }
  ]
  const selectedAccounts = ['acc-1', 'acc-2']

  describe('Cenário A – Data D sem lançamentos em D, mas com anteriores', () => {
    it('deve calcular totais acumulados até D, não zerar quando não há lançamentos em D', () => {
      const selectedDateStr = '2026-04-22'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 200,
          due_date: '2026-04-20'  // Anterior a D
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'PENDENTE',
          amount: 300,
          due_date: '2026-04-01'  // Anterior a D, pendente
        }
      ]

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)

      // DESPESA CONFIRMADA até D deve ser contada nas saídas
      expect(result.saidas).toBe(200)
      // RECEITA PENDENTE não entra em entradas (só CONFIRMADO/CONCILIADO)
      expect(result.entradas).toBe(0)
      // Resultado deve refletir o acumulado, não ser zero
      expect(result.resultado).toBe(-200)  // entradas - saidas = 0 - 200
      
      // Projeções devem incluir PENDENTES até D
      expect(result.receitas).toBe(300)  // inclui PENDENTE
      expect(result.despesas).toBe(200)
    })
  })

  describe('Cenário B – Data D com lançamentos em D', () => {
    it('deve preservar comportamento atual, acumulando corretamente até D', () => {
      const selectedDateStr = '2026-04-24'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 100,
          due_date: '2026-04-20'  // Anterior
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 500,
          due_date: '2026-04-24'  // Exatamente D
        },
        {
          id: 'tx-3',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'PENDENTE',
          amount: 50,
          due_date: '2026-04-23'  // Anterior, pendente
        }
      ]

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)

      // Entradas: receitas CONFIRMADAS até D (500)
      expect(result.entradas).toBe(500)
      // Saídas: despesas CONFIRMADAS até D (100)
      expect(result.saidas).toBe(100)
      // Resultado: 500 - 100 = 400
      expect(result.resultado).toBe(400)
      
      // Projeções incluem PENDENTES
      expect(result.receitas).toBe(500)
      expect(result.despesas).toBe(150)  // 100 confirmada + 50 pendente
    })
  })

  describe('Cenário C – Data D com apenas pendentes anteriores', () => {
    it('deve mostrar entradas/saídas realizadas como 0, mas projeções com valores', () => {
      const selectedDateStr = '2026-04-25'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'PENDENTE',
          amount: 100,
          due_date: '2026-04-20'  // Anterior, pendente
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'PENDENTE',
          amount: 200,
          due_date: '2026-04-24'  // Anterior, pendente
        }
      ]

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)

      // Sem CONFIRMADOS/CONCILIADOS até D
      expect(result.entradas).toBe(0)
      expect(result.saidas).toBe(0)
      expect(result.resultado).toBe(0)
      
      // Mas projeções incluem PENDENTES
      expect(result.receitas).toBe(200)
      expect(result.despesas).toBe(100)
    })
  })

  describe('Segurança e robustez – Dados inconsistentes', () => {
    it('deve ignorar transações com due_date inválida sem lançar exceção', () => {
      const selectedDateStr = '2026-04-22'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 100,
          due_date: ''  // Data inválida/vazia
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 200,
          due_date: '2026-04-20'  // Válida
        }
      ]

      // Não deve lançar exceção
      expect(() => {
        calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      }).not.toThrow()

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      
      // Deve considerar só a transação válida
      expect(result.saidas).toBe(200)
    })

    it('deve ignorar transações com type inesperado', () => {
      const selectedDateStr = '2026-04-22'
      const transactions = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'TRANSFERENCIA',  // Status inesperado
          status: 'CONFIRMADO',
          amount: 100,
          due_date: '2026-04-20'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 200,
          due_date: '2026-04-20'
        }
      ] as Transaction[]

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      
      // TRANSFERENCIA não deve afetar entradas/saídas (por enquanto)
      expect(result.entradas).toBe(0)
      expect(result.saidas).toBe(200)
    })

    it('deve lidar com amount undefined ou negativo de forma segura', () => {
      const selectedDateStr = '2026-04-22'
      const transactions = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: -100,  // Negativo - pode acontecer por inconsistência
          due_date: '2026-04-20'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 0,  // Zero
          due_date: '2026-04-20'
        }
      ] as Transaction[]

      expect(() => {
        calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      }).not.toThrow()

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      
      // Deve usar Math.abs para garantir valores positivos
      expect(result.saidas).toBe(100)
      expect(result.entradas).toBe(0)
    })
  })

  describe('Filtro de contas', () => {
    it('deve ignorar transações de contas não selecionadas', () => {
      const selectedDateStr = '2026-04-22'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 500,
          due_date: '2026-04-20'
        },
        {
          id: 'tx-2',
          account_id: 'acc-2',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 300,
          due_date: '2026-04-20'
        },
        {
          id: 'tx-3',
          account_id: 'acc-3',  // Conta não selecionada
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 200,
          due_date: '2026-04-20'
        }
      ]
      
      const selectedAccs = ['acc-1']  // Só acc-1 selecionada

      const result = calculateTotals(transactions, selectedDateStr, selectedAccs, accounts)

      // Só deve considerar acc-1 (500)
      expect(result.entradas).toBe(500)
    })
  })

  describe('Datas futuras (due_date > D)', () => {
    it('deve ignorar transações com data posterior a D', () => {
      const selectedDateStr = '2026-04-22'
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 100,
          due_date: '2026-04-20'  // <= D, deve ser contada
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONFIRMADO',
          amount: 200,
          due_date: '2026-04-25'  // > D, NÃO deve ser contada
        }
      ]

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts)
      
      // Só deve contar tx-1 (100)
      expect(result.saidas).toBe(100)
    })
  })
})
