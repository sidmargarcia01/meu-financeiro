/**
 * 📄 Descrição: Testes para cálculo de Confirmado/Projetado por conta
 * 🧱 Contexto: Coluna CONTAS na tela de lançamentos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-01-26
 * ⚙️ Tecnologias: Jest, TypeScript
 * 🔍 Dependências: accountBalances calculation logic
 * ✅ Revisado: Sim
 */

// Tipo simplificado de transação para testes
interface TestTransaction {
  id: string
  account_id: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO'
  amount: number
  due_date: string
}

interface TestAccount {
  id: string
  name: string
  initialBalance: number
}

// Função que replica a lógica de cálculo de saldos
function calculateAccountBalances(
  transactions: TestTransaction[],
  accounts: TestAccount[],
  selectedDateStr: string
): { [accountId: string]: { confirmed: number; projected: number } } {
  const balances: { [accountId: string]: { confirmed: number; projected: number } } = {}

  accounts.forEach(acc => {
    const initial = acc.initialBalance || 0

    // Transacoes ate a data selecionada (inclusive)
    const txsUntilDate = transactions.filter(t =>
      t.due_date <= selectedDateStr &&
      t.account_id === acc.id
    )

    // Confirmado: apenas CONFIRMADO e CONCILIADO
    const confirmed = txsUntilDate
      .filter(t => ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
      .reduce((sum, t) => {
        if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
        if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
        return sum
      }, initial)

    // Projetado: todas as transacoes (PENDENTE/AGENDADO tambem)
    const projected = txsUntilDate
      .reduce((sum, t) => {
        if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
        if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
        return sum
      }, initial)

    balances[acc.id] = { confirmed, projected }
  })

  return balances
}

describe('Cálculo de Confirmado/Projetado por conta', () => {
  const mockAccounts: TestAccount[] = [
    { id: 'acc-inter', name: 'INTER EMPRESA', initialBalance: 0.23 },
    { id: 'acc-nubank', name: 'NUBANK PJ', initialBalance: 0.34 },
  ]

  const mockTransactions: TestTransaction[] = [
    // Dia 01/04 - pendente
    { id: 'tx-01', account_id: 'acc-inter', type: 'DESPESA', status: 'PENDENTE', amount: 22.33, due_date: '2026-04-01' },
    // Dia 24/04 - confirmados (vários)
    { id: 'tx-24-1', account_id: 'acc-inter', type: 'RECEITA', status: 'CONFIRMADO', amount: 180.00, due_date: '2026-04-24' },
    { id: 'tx-24-2', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 119.64, due_date: '2026-04-24' },
    { id: 'tx-24-3', account_id: 'acc-inter', type: 'RECEITA', status: 'CONFIRMADO', amount: 10263.68, due_date: '2026-04-24' },
    { id: 'tx-24-4', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 2721.13, due_date: '2026-04-24' },
    { id: 'tx-24-5', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 173.60, due_date: '2026-04-24' },
    { id: 'tx-24-6', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 799.01, due_date: '2026-04-24' },
    { id: 'tx-24-7', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 1320.00, due_date: '2026-04-24' },
    { id: 'tx-24-8', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 875.00, due_date: '2026-04-24' },
    { id: 'tx-24-9', account_id: 'acc-inter', type: 'DESPESA', status: 'CONFIRMADO', amount: 900.00, due_date: '2026-04-24' },
    // Dia 25/04 - pendente
    { id: 'tx-25', account_id: 'acc-inter', type: 'DESPESA', status: 'PENDENTE', amount: 2.22, due_date: '2026-04-25' },
    // Dia 30/04 - agendado (futuro)
    { id: 'tx-30', account_id: 'acc-inter', type: 'DESPESA', status: 'AGENDADO', amount: 100.00, due_date: '2026-04-30' },
  ]

  describe('Cenário 23/04/2026 (antes dos confirmados)', () => {
    const selectedDate = '2026-04-23'

    it('Confirmado = saldo inicial (sem confirmados até 23/04)', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Confirmado: 0.23 (saldo inicial, nenhum confirmado até 23/04)
      expect(balances['acc-inter'].confirmed).toBeCloseTo(0.23, 2)
    })

    it('Projetado = saldo inicial + pendente de 01/04 (até 23/04)', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Projetado: 0.23 + (-22.33) = -22.10
      // NÃO deve incluir pendente de 25/04 (data futura > 23/04)
      // NÃO deve incluir agendado de 30/04 (data futura > 23/04)
      expect(balances['acc-inter'].projected).toBeCloseTo(-22.10, 2)
    })

    it('NÃO deve incluir transações com due_date > D', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Verifica que não entrou o pendente de 25/04 nem agendado de 30/04
      const projected = balances['acc-inter'].projected
      // Se incluísse 25/04: 0.23 - 22.33 - 2.22 = -24.32
      // Como não inclui: 0.23 - 22.33 = -22.10
      expect(projected).toBeCloseTo(-22.10, 2)
      expect(projected).not.toBeCloseTo(-24.32, 2) // Garante que não incluiu 25/04
    })
  })

  describe('Cenário 24/04/2026 (dia dos confirmados)', () => {
    const selectedDate = '2026-04-24'

    it('Confirmado = saldo inicial + todos confirmados de 24/04', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Saldo inicial: 0.23
      // Confirmados 24/04: +180 -119.64 +10263.68 -2721.13 -173.60 -799.01 -1320 -875 -900
      // = 180 - 119.64 + 10263.68 - 2721.13 - 173.60 - 799.01 - 1320 - 875 - 900
      // = 3535.30 + 0.23 = 3535.53
      expect(balances['acc-inter'].confirmed).toBeCloseTo(3535.53, 2)
    })

    it('Projetado = Confirmado (sem pendentes até 24/04)', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Como não há pendentes até 24/04, projetado = confirmado
      expect(balances['acc-inter'].projected).toBeCloseTo(3535.53, 2)
    })
  })

  describe('Cenário 26/04/2026 (após confirmados, com pendentes)', () => {
    const selectedDate = '2026-04-26'

    it('Confirmado mantém os confirmados de 24/04', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Deve manter os confirmados de 24/04
      // 0.23 + 3535.30 = 3535.53
      expect(balances['acc-inter'].confirmed).toBeCloseTo(3535.53, 2)
    })

    it('Projetado = Confirmado + pendentes de 01/04 e 25/04', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Projetado: 3535.53 + (-22.33) + (-2.22) = 3510.98
      expect(balances['acc-inter'].projected).toBeCloseTo(3510.98, 2)
    })

    it('NÃO deve incluir agendado de 30/04 (futuro > 26/04)', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Se incluísse agendado de 30/04: 3510.98 - 100 = 3410.98
      // Como não inclui: 3510.98
      expect(balances['acc-inter'].projected).toBeCloseTo(3510.98, 2)
      expect(balances['acc-inter'].projected).not.toBeCloseTo(3410.98, 2)
    })
  })

  describe('Cenário 30/04/2026 (incluindo agendado)', () => {
    const selectedDate = '2026-04-30'

    it('Confirmado mantém histórico', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Confirmado: mesmo valor de antes (0.23 + confirmados 24/04)
      expect(balances['acc-inter'].confirmed).toBeCloseTo(3535.53, 2)
    })

    it('Projetado inclui agendado de 30/04', () => {
      const balances = calculateAccountBalances(mockTransactions, mockAccounts, selectedDate)

      // Projetado: 3535.53 - 22.33 - 2.22 - 100 = 3410.98
      expect(balances['acc-inter'].projected).toBeCloseTo(3410.98, 2)
    })
  })

  describe('Múltiplas contas', () => {
    it('calcula saldos independentemente por conta', () => {
      const txs: TestTransaction[] = [
        { id: 'tx-1', account_id: 'acc-inter', type: 'RECEITA', status: 'CONFIRMADO', amount: 100, due_date: '2026-04-24' },
        { id: 'tx-2', account_id: 'acc-nubank', type: 'DESPESA', status: 'PENDENTE', amount: 50, due_date: '2026-04-24' },
      ]

      const balances = calculateAccountBalances(txs, mockAccounts, '2026-04-24')

      // INTER: 0.23 + 100 = 100.23 confirmado/projetado
      expect(balances['acc-inter'].confirmed).toBeCloseTo(100.23, 2)
      expect(balances['acc-inter'].projected).toBeCloseTo(100.23, 2)

      // NUBANK: 0.34 - 50 = -49.66 projetado (pendente), 0.34 confirmado
      expect(balances['acc-nubank'].confirmed).toBeCloseTo(0.34, 2)
      expect(balances['acc-nubank'].projected).toBeCloseTo(-49.66, 2)
    })
  })
})
