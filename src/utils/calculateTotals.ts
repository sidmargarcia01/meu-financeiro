/**
 * CAMADA: Utilitário Puro
 * MÓDULO: calculateTotals
 * RESPONSABILIDADE: Calcular totais (entradas, saídas, projeções) da tela de lançamentos
 * REGRA: Considera todas as transações até a data selecionada D (inclusive), ou seja, due_date <= D
 * NÃO DEVE: Acessar estado global, backend, ou efeitos colaterais
 * DEPENDE DE: Apenas parâmetros de entrada
 * 
 * FASE 1 - Refatoração de critério de data para "Resultados (R$)"
 */

export interface Transaction {
  id: string
  account_id?: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' | string
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO' | string
  amount: number
  due_date: string
}

export interface Account {
  id: string
  initialBalance?: number
}

export interface TotalsResult {
  entradas: number
  saidas: number
  resultado: number
  receitas: number
  despesas: number
  saldoInicial: number
}

/**
 * Calcula os totais para o bloco "Resultados (R$)" da tela de lançamentos.
 * 
 * Regra de data: considera transações com due_date <= selectedDateStr (até D, inclusive).
 * Isso corrige o bug anterior que usava apenas due_date === selectedDateStr (dia exato).
 * 
 * @param transactions - Lista de transações já filtradas por status/contas (filteredTransactions)
 * @param selectedDateStr - Data selecionada no calendário (formato ISO yyyy-mm-dd)
 * @param selectedAccounts - IDs das contas selecionadas
 * @param accounts - Lista de contas para obter saldo inicial
 * @returns TotaisResult com entradas, saídas, resultado, projeções e saldo inicial
 */
export function calculateTotals(
  transactions: Transaction[],
  selectedDateStr: string,
  selectedAccounts: string[],
  accounts: Account[]
): TotalsResult {
  // Saldo inicial das contas selecionadas
  const saldoInicial = accounts
    .filter(a => selectedAccounts.includes(a.id))
    .reduce((sum, a) => sum + (a.initialBalance || 0), 0)

  // Filtrar transações até a data D (inclusive) e das contas selecionadas
  const txsAteD = transactions.filter(t => {
    // Segurança: ignorar transações com data inválida
    if (!t.due_date || t.due_date.length < 10) return false
    // Segurança: ignorar transações sem account_id ou de conta não selecionada
    if (!t.account_id || !selectedAccounts.includes(t.account_id)) return false
    // Regra principal: due_date <= selectedDateStr
    return t.due_date <= selectedDateStr
  })

  // Entradas (realizadas): RECEITA com status CONFIRMADO ou CONCILIADO
  const entradas = txsAteD
    .filter(t =>
      t.type === 'RECEITA' &&
      (t.status === 'CONFIRMADO' || t.status === 'CONCILIADO')
    )
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  // Saídas (realizadas): DESPESA com status CONFIRMADO ou CONCILIADO
  const saidas = txsAteD
    .filter(t =>
      t.type === 'DESPESA' &&
      (t.status === 'CONFIRMADO' || t.status === 'CONCILIADO')
    )
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  // Projeções (incluem PENDENTE/AGENDADO também)
  const receitas = txsAteD
    .filter(t => t.type === 'RECEITA')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  const despesas = txsAteD
    .filter(t => t.type === 'DESPESA')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  return {
    entradas,
    saidas,
    resultado: entradas - saidas,
    receitas,
    despesas,
    saldoInicial
  }
}
