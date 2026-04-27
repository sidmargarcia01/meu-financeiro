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

describe('calculateTotals - Fase 2: Independência de selectedStatuses (chips)', () => {
  // Dados base para reuso
  const accounts: Account[] = [
    { id: 'acc-1', initialBalance: 1000 }
  ]
  const selectedAccounts = ['acc-1']
  const selectedDateStr = '2026-04-24'

  const baseTransactions: Transaction[] = [
    {
      id: 'tx-1',
      account_id: 'acc-1',
      type: 'RECEITA',
      status: 'CONFIRMADO',
      amount: 500,
      due_date: '2026-04-24'
    },
    {
      id: 'tx-2',
      account_id: 'acc-1',
      type: 'DESPESA',
      status: 'CONFIRMADO',
      amount: 200,
      due_date: '2026-04-24'
    },
    {
      id: 'tx-3',
      account_id: 'acc-1',
      type: 'RECEITA',
      status: 'PENDENTE',
      amount: 300,
      due_date: '2026-04-24'
    },
    {
      id: 'tx-4',
      account_id: 'acc-1',
      type: 'DESPESA',
      status: 'PENDENTE',
      amount: 100,
      due_date: '2026-04-24'
    }
  ]

  describe('Cenário 1 – Realizado independe dos chips (selectedStatuses = [PENDENTE])', () => {
    it('deve calcular entradas/saidas com CONFIRMADO mesmo sem CONFIRMADO nos chips', () => {
      const selectedStatuses = ['PENDENTE']  // Chips: só PENDENTE

      const result = calculateTotals(
        baseTransactions,
        selectedDateStr,
        selectedAccounts,
        accounts,
        selectedStatuses
      )

      // Realizado (entradas/saidas) deve incluir CONFIRMADO/CONCILIADO
      // mesmo que não esteja nos chips (PENDENTE)
      expect(result.entradas).toBe(500)  // RECEITA CONFIRMADA
      expect(result.saidas).toBe(200)  // DESPESA CONFIRMADA
      expect(result.resultado).toBe(300)  // 500 - 200

      // Projeções incluem todos os status
      expect(result.receitas).toBe(800)  // 500 CONFIRMADO + 300 PENDENTE
      expect(result.despesas).toBe(300)  // 200 CONFIRMADO + 100 PENDENTE
    })
  })

  describe('Cenário 2 – Chips com apenas CONFIRMADO', () => {
    it('deve manter mesmo resultado do cenário 1 (chips não interferem nos totais)', () => {
      const selectedStatuses = ['CONFIRMADO']  // Chips: só CONFIRMADO

      const result = calculateTotals(
        baseTransactions,
        selectedDateStr,
        selectedAccounts,
        accounts,
        selectedStatuses
      )

      // Entradas/saídas idênticas ao cenário 1
      expect(result.entradas).toBe(500)
      expect(result.saidas).toBe(200)
      expect(result.resultado).toBe(300)

      // Projeções também idênticas (incluem todos os status)
      expect(result.receitas).toBe(800)
      expect(result.despesas).toBe(300)
    })
  })

  describe('Cenário 3 – Sem CONFIRMADO/CONCILIADO (somente PENDENTE/AGENDADO)', () => {
    it('deve ter entradas/saidas zeradas mas projeções preenchidas', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'PENDENTE',
          amount: 400,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'AGENDADO',
          amount: 150,
          due_date: '2026-04-24'
        }
      ]
      const selectedStatuses = ['PENDENTE', 'AGENDADO']

      const result = calculateTotals(
        transactions,
        selectedDateStr,
        selectedAccounts,
        accounts,
        selectedStatuses
      )

      // Sem CONFIRMADO/CONCILIADO, realizado é zero
      expect(result.entradas).toBe(0)
      expect(result.saidas).toBe(0)
      expect(result.resultado).toBe(0)

      // Mas projeções incluem PENDENTE/AGENDADO
      expect(result.receitas).toBe(400)
      expect(result.despesas).toBe(150)
    })
  })

  describe('Cenário 4 – selectedStatuses vazio (caso extremo de UI)', () => {
    it('deve ser robusta mesmo com chips desmarcados', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 500,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONCILIADO',
          amount: 100,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-3',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'PENDENTE',
          amount: 300,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-4',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'AGENDADO',
          amount: 200,
          due_date: '2026-04-24'
        }
      ]
      const selectedStatuses: string[] = []  // Vazio!

      // Não deve lançar exceção
      expect(() => {
        calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts, selectedStatuses)
      }).not.toThrow()

      const result = calculateTotals(transactions, selectedDateStr, selectedAccounts, accounts, selectedStatuses)

      // Totais calculados normalmente (independente dos chips)
      expect(result.entradas).toBe(500)  // CONFIRMADO
      expect(result.saidas).toBe(100)  // CONCILIADO
      expect(result.resultado).toBe(400)

      // Projeções incluem todos
      expect(result.receitas).toBe(800)  // 500 + 300
      expect(result.despesas).toBe(300)  // 100 + 200
    })
  })

  describe('Cenário 5 – CONCILIADO também entra em realizado', () => {
    it('deve somar CONFIRMADO + CONCILIADO nas entradas/saídas', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONFIRMADO',
          amount: 300,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'RECEITA',
          status: 'CONCILIADO',
          amount: 200,
          due_date: '2026-04-24'
        },
        {
          id: 'tx-3',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'CONCILIADO',
          amount: 150,
          due_date: '2026-04-24'
        }
      ]
      const selectedStatuses = ['CONFIRMADO']  // Chips só com CONFIRMADO

      const result = calculateTotals(
        transactions,
        selectedDateStr,
        selectedAccounts,
        accounts,
        selectedStatuses
      )

      // Realizado: CONFIRMADO + CONCILIADO = 300 + 200 = 500
      expect(result.entradas).toBe(500)
      expect(result.saidas).toBe(150)
      expect(result.resultado).toBe(350)
    })
  })

  /**
   * FASE 4 - Correção de BUG: Projeções (receitas/despesas) devem incluir PENDENTE/AGENDADO
   * 
   * Cenário: Em dias sem CONFIRMADOS/CONCILIADOS (ex: 22/04, 23/04, 25/04, 27/04),
   * as projeções estavam zerando porque AGENDADO não estava sendo buscado no fetch.
   * 
   * Estes testes garantem que calculateTotals processa corretamente PENDENTE/AGENDADO.
   */
  describe('Fase 4 - Correção: Projeções incluem PENDENTE e AGENDADO', () => {
    const accounts = [{ id: 'acc-1', initialBalance: 0 }]

    it('deve incluir PENDENTE nas projeções quando due_date <= D', () => {
      // Cenário: selectedDateStr = '2026-04-23'
      // Transações:
      // - 01/04 PENDENTE DESPESA 22.33
      // - 25/04 AGENDADO DESPESA 2.22 (futuro, não entra)
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'PENDENTE',
          amount: 22.33,
          due_date: '2026-04-01'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'AGENDADO',
          amount: 2.22,
          due_date: '2026-04-25'
        }
      ]

      const result = calculateTotals(
        transactions,
        '2026-04-23',  // D = 23/04
        ['acc-1'],
        accounts
      )

      // Realizado: nenhum CONFIRMADO/CONCILIADO até 23/04
      expect(result.entradas).toBe(0)
      expect(result.saidas).toBe(0)

      // Projeções: deve incluir o PENDENTE de 01/04 (due_date <= D)
      // mas NÃO o AGENDADO de 25/04 (due_date > D)
      expect(result.receitas).toBe(0)
      expect(result.despesas).toBeCloseTo(22.33, 2)  // Só a despesa PENDENTE de 01/04
    })

    it('deve incluir PENDENTE e AGENDADO nas projeções quando due_date <= D', () => {
      // Cenário: selectedDateStr = '2026-04-25'
      // Transações:
      // - 01/04 PENDENTE DESPESA 22.33
      // - 25/04 AGENDADO DESPESA 2.22
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'PENDENTE',
          amount: 22.33,
          due_date: '2026-04-01'
        },
        {
          id: 'tx-2',
          account_id: 'acc-1',
          type: 'DESPESA',
          status: 'AGENDADO',
          amount: 2.22,
          due_date: '2026-04-25'
        }
      ]

      const result = calculateTotals(
        transactions,
        '2026-04-25',  // D = 25/04
        ['acc-1'],
        accounts
      )

      // Realizado: nenhum CONFIRMADO/CONCILIADO até 25/04
      expect(result.entradas).toBe(0)
      expect(result.saidas).toBe(0)

      // Projeções: deve incluir AMBOS (due_date <= D)
      expect(result.receitas).toBe(0)
      expect(result.despesas).toBeCloseTo(24.55, 2)  // 22.33 + 2.22
    })

    it('deve diferenciar realizado (CONFIRMADO) de projeção (PENDENTE/AGENDADO)', () => {
      // Cenário com todos os status
      const transactions: Transaction[] = [
        // Realizado
        { id: 'tx-1', account_id: 'acc-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 100, due_date: '2026-04-20' },
        { id: 'tx-2', account_id: 'acc-1', type: 'DESPESA', status: 'CONCILIADO', amount: 50, due_date: '2026-04-20' },
        // Projeções
        { id: 'tx-3', account_id: 'acc-1', type: 'RECEITA', status: 'PENDENTE', amount: 30, due_date: '2026-04-20' },
        { id: 'tx-4', account_id: 'acc-1', type: 'DESPESA', status: 'AGENDADO', amount: 20, due_date: '2026-04-20' }
      ]

      const result = calculateTotals(
        transactions,
        '2026-04-20',
        ['acc-1'],
        accounts
      )

      // Realizado (CONFIRMADO + CONCILIADO)
      expect(result.entradas).toBe(100)
      expect(result.saidas).toBe(50)
      expect(result.resultado).toBe(50)

      // Projeções (todos os status)
      expect(result.receitas).toBe(130)  // 100 + 30
      expect(result.despesas).toBe(70)   // 50 + 20
    })

    it('deve funcionar em dias sem CONFIRMADOS (ex: 22/04, 23/04, 25/04, 27/04)', () => {
      // Simula o bug reportado: dias sem CONFIRMADOS/CONCILIADOS
      const transactions: Transaction[] = [
        { id: 'tx-1', account_id: 'acc-1', type: 'DESPESA', status: 'PENDENTE', amount: 100, due_date: '2026-04-01' },
        { id: 'tx-2', account_id: 'acc-1', type: 'DESPESA', status: 'AGENDADO', amount: 200, due_date: '2026-04-25' }
      ]

      // Testar para D = 22/04 (antes do AGENDADO)
      const result22 = calculateTotals(transactions, '2026-04-22', ['acc-1'], accounts)
      expect(result22.entradas).toBe(0)
      expect(result22.saidas).toBe(0)
      expect(result22.despesas).toBe(100)  // Só o PENDENTE de 01/04

      // Testar para D = 23/04 (antes do AGENDADO)
      const result23 = calculateTotals(transactions, '2026-04-23', ['acc-1'], accounts)
      expect(result23.despesas).toBe(100)

      // Testar para D = 25/04 (dia do AGENDADO)
      const result25 = calculateTotals(transactions, '2026-04-25', ['acc-1'], accounts)
      expect(result25.despesas).toBe(300)  // 100 + 200

      // Testar para D = 27/04 (depois do AGENDADO)
      const result27 = calculateTotals(transactions, '2026-04-27', ['acc-1'], accounts)
      expect(result27.despesas).toBe(300)
    })
  })
})
