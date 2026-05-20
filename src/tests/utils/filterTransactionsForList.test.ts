/**
 * 📄 Descrição: Testes para filterTransactionsForList
 * 🧱 Contexto: Regra de negócio da lista de lançamentos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-26
 * ⚙️ Tecnologias: Jest, TypeScript
 * 🔍 Dependências: filterTransactionsForList, getDisplayDateLabel
 * ✅ Revisado: Sim
 */

import { filterTransactionsForList, getDisplayDateLabel } from '@/utils/filterTransactionsForList'

// Tipo mínimo compatível para testes
interface TestTransaction {
  id: string
  account_id?: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' | string
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO' | string
  amount: number
  due_date: string
  payment_date?: string
}

describe('filterTransactionsForList', () => {
  const mockTransactions: TestTransaction[] = [
    // Pendentes passados
    { id: 'tx-01', account_id: 'acc-1', type: 'DESPESA', status: 'PENDENTE', amount: 100, due_date: '2026-04-01' },
    { id: 'tx-25', account_id: 'acc-1', type: 'DESPESA', status: 'PENDENTE', amount: 200, due_date: '2026-04-25' },
    // Hoje (26/04)
    { id: 'tx-hoje-pendente', account_id: 'acc-1', type: 'DESPESA', status: 'PENDENTE', amount: 50, due_date: '2026-04-26' },
    { id: 'tx-hoje-confirmado', account_id: 'acc-1', type: 'RECEITA', status: 'CONFIRMADO', amount: 500, due_date: '2026-04-26' },
    // Futuro
    { id: 'tx-30', account_id: 'acc-1', type: 'DESPESA', status: 'AGENDADO', amount: 300, due_date: '2026-04-30' },
    // Outros status
    { id: 'tx-hoje-conciliado', account_id: 'acc-1', type: 'RECEITA', status: 'CONCILIADO', amount: 150, due_date: '2026-04-26' },
  ]

  describe('D < today (dia passado)', () => {
    const todayStr = '2026-04-26'

    it('deve listar apenas lançamentos com due_date === D', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-25', todayStr)

      // Deve mostrar apenas o PENDENTE de 25/04
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('tx-25')
      expect(result[0].due_date).toBe('2026-04-25')
    })

    it('NÃO deve mostrar pendentes de outros dias em dia passado', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-23', todayStr)

      // 23/04 não tem lançamentos
      expect(result).toHaveLength(0)
    })

    it('NÃO deve mostrar agendados de 25/04 quando D=23/04', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-23', todayStr)

      // Não deve ter o agendado de 25/04
      const hasTx25 = result.some(tx => tx.id === 'tx-25')
      expect(hasTx25).toBe(false)
    })
  })

  describe('D === today (dia atual)', () => {
    const todayStr = '2026-04-26'

    it('deve listar pendentes em aberto (due_date <= today)', () => {
      const result = filterTransactionsForList(mockTransactions, todayStr, todayStr)

      // Deve incluir pendentes de 01/04, 25/04 e hoje
      const pendingIds = result
        .filter(tx => tx.status === 'PENDENTE')
        .map(tx => tx.id)

      expect(pendingIds).toContain('tx-01')
      expect(pendingIds).toContain('tx-25')
      expect(pendingIds).toContain('tx-hoje-pendente')
    })

    it('deve listar todos os lançamentos de hoje (qualquer status)', () => {
      const result = filterTransactionsForList(mockTransactions, todayStr, todayStr)

      // Deve ter os 3 lançamentos de hoje
      const todayIds = result
        .filter(tx => tx.due_date === todayStr)
        .map(tx => tx.id)

      expect(todayIds).toContain('tx-hoje-pendente')
      expect(todayIds).toContain('tx-hoje-confirmado')
      expect(todayIds).toContain('tx-hoje-conciliado')
    })

    it('NÃO deve listar agendados futuros (due_date > today)', () => {
      const result = filterTransactionsForList(mockTransactions, todayStr, todayStr)

      // Não deve ter o agendado de 30/04
      const hasFuture = result.some(tx => tx.id === 'tx-30')
      expect(hasFuture).toBe(false)
    })

    it('lista completa: pendentes em aberto + lançamentos de hoje', () => {
      const result = filterTransactionsForList(mockTransactions, todayStr, todayStr)

      // Total: tx-01, tx-25, tx-hoje-pendente, tx-hoje-confirmado, tx-hoje-conciliado = 5
      expect(result).toHaveLength(5)
    })
  })

  describe('D > today (dia futuro)', () => {
    const todayStr = '2026-04-26'

    it('deve listar apenas lançamentos com due_date === D', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-30', todayStr)

      // Deve mostrar apenas o AGENDADO de 30/04
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('tx-30')
    })

    it('NÃO deve replicar pendentes do passado para dia futuro', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-27', todayStr)

      // Não deve ter pendentes de 01/04 ou 25/04
      const hasOldPending = result.some(tx => tx.id === 'tx-01' || tx.id === 'tx-25')
      expect(hasOldPending).toBe(false)
    })

    it('NÃO deve mostrar lançamentos de hoje em dia futuro', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-27', todayStr)

      // Não deve ter lançamentos de 26/04
      const hasToday = result.some(tx => tx.due_date === '2026-04-26')
      expect(hasToday).toBe(false)
    })
  })

  describe('Cenários específicos do bug reportado', () => {
    const todayStr = '2026-04-26'

    it('23/04/2026: NÃO deve aparecer agendado de 25/04', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-23', todayStr)

      // D=23/04 < today=26/04, então só mostra due_date === 23/04
      expect(result.some(tx => tx.due_date === '2026-04-25')).toBe(false)
    })

    it('24/04/2026: NÃO deve aparecer pendente de 01/04', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-24', todayStr)

      // D=24/04 < today=26/04, então só mostra due_date === 24/04
      expect(result.some(tx => tx.id === 'tx-01')).toBe(false)
    })

    it('27/04/2026: NÃO devem aparecer pendentes de 01/04 e 25/04', () => {
      const result = filterTransactionsForList(mockTransactions, '2026-04-27', todayStr)

      // D=27/04 > today=26/04, então só mostra due_date === 27/04
      expect(result.some(tx => tx.id === 'tx-01')).toBe(false)
      expect(result.some(tx => tx.id === 'tx-25')).toBe(false)
    })

    it('26/04/2026 (hoje): DEVE mostrar pendentes de 01/04 e 25/04', () => {
      const result = filterTransactionsForList(mockTransactions, todayStr, todayStr)

      // D=today, então mostra pendentes em aberto + lançamentos de hoje
      expect(result.some(tx => tx.id === 'tx-01')).toBe(true)
      expect(result.some(tx => tx.id === 'tx-25')).toBe(true)
    })
  })

  describe('CONCILIADO com payment_date diferente de due_date', () => {
    const todayStr = '2026-05-20'

    const txs: TestTransaction[] = [
      // Conciliada com due_date=20 mas pagamento efetivo no dia 19
      {
        id: 'tx-conciliado',
        type: 'DESPESA',
        status: 'CONCILIADO',
        amount: 5034.67,
        due_date: '2026-05-20',
        payment_date: '2026-05-19',
      },
      // Pendente no dia 20
      {
        id: 'tx-pendente',
        type: 'DESPESA',
        status: 'PENDENTE',
        amount: 100,
        due_date: '2026-05-20',
      },
    ]

    it('deve aparecer no dia 19 (payment_date), NÃO no dia 20', () => {
      const result19 = filterTransactionsForList(txs, '2026-05-19', todayStr)
      expect(result19.some(tx => tx.id === 'tx-conciliado')).toBe(true)
    })

    it('NÃO deve aparecer no dia 20 (due_date) pois payment_date=19', () => {
      const result20 = filterTransactionsForList(txs, '2026-05-20', todayStr)
      expect(result20.some(tx => tx.id === 'tx-conciliado')).toBe(false)
      // Mas o pendente do dia 20 deve aparecer
      expect(result20.some(tx => tx.id === 'tx-pendente')).toBe(true)
    })
  })
})

describe('getDisplayDateLabel', () => {
  const todayStr = '2026-04-26'

  it('retorna "hoje" quando due_date === todayStr', () => {
    expect(getDisplayDateLabel('2026-04-26', todayStr)).toBe('hoje')
  })

  it('retorna data formatada quando due_date !== todayStr (passado)', () => {
    expect(getDisplayDateLabel('2026-04-01', todayStr)).toBe('01/04/26')
  })

  it('retorna data formatada quando due_date !== todayStr (futuro)', () => {
    expect(getDisplayDateLabel('2026-04-30', todayStr)).toBe('30/04/26')
  })

  it('funciona para qualquer data selecionada (não só selectedDate)', () => {
    // Mesmo quando a data selecionada é 24/04, se hoje é 26/04,
    // o label de 24/04 deve ser "24/04/26", não "hoje"
    expect(getDisplayDateLabel('2026-04-24', todayStr)).toBe('24/04/26')
  })
})
