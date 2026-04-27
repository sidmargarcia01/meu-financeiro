/**
 * CAMADA: Utilitário Puro
 * MÓDULO: calculateTotals
 * RESPONSABILIDADE: Calcular totais (entradas, saídas, projeções) da tela de lançamentos
 * REGRA: Considera todas as transações até a data selecionada D (inclusive), ou seja, due_date <= D
 * NÃO DEVE: Acessar estado global, backend ou efeitos colaterais
 * DEPENDE DE: Apenas parâmetros de entrada
 * 
 * FASE 1 - Refatoração de critério de data para "Resultados (R$)"
 * FASE 2 - selectedStatuses parametrizado (ainda não afeta cálculo, preparado para Fase 3)
 */

export interface Transaction {
  id: string
  account_id?: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA' | string
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO' | string
  amount: number
  due_date: string
}

export type TransactionStatus = 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO' | string

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
 * FASE 2 - DECISÃO DE PRODUTO:
 * selectedStatuses é recebido mas NÃO afeta o cálculo nesta fase.
 * Os totais (entradas/saídas) são independentes dos chips de filtro da UI.
 * Isso evita confusão do tipo "Resultado zerou só porque desmarquei Confirmado".
 * 
 * TODO FASE 3: Se o produto decidir que chips DEVEM afetar totais:
 *   - Alterar filtros abaixo para considerar selectedStatuses
 *   - Ou criar variantes: calculateTotalsRealizado(), calculateTotalsProjetado()
 * 
 * @param transactions - Lista de transações já filtradas por status/contas (filteredTransactions)
 * @param selectedDateStr - Data selecionada no calendário (formato ISO yyyy-mm-dd)
 * @param selectedAccounts - IDs das contas selecionadas
 * @param accounts - Lista de contas para obter saldo inicial
 * @param selectedStatuses - IDs de status selecionados nos chips (recebido mas não usado na Fase 2)
 * @returns TotaisResult com entradas, saídas, resultado, projeções e saldo inicial
 */
export function calculateTotals(
  transactions: Transaction[],
  selectedDateStr: string,
  selectedAccounts: string[],
  accounts: Account[],
  selectedStatuses?: string[]  // FASE 2: Adicionado para futura evolução
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

  // Projeções (incluem PENDENTE/AGENDADO/CONFIRMADO/CONCILIADO)
  // FASE 2: Projeções também são independentes de selectedStatuses por enquanto
  // Todas as RECEITAS até D entram nas receitas (projeção)
  const receitas = txsAteD
    .filter(t => t.type === 'RECEITA')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  // Todas as DESPESAS até D entram nas despesas (projeção)
  const despesas = txsAteD
    .filter(t => t.type === 'DESPESA')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0)

  // FASE 2: selectedStatuses recebido mas não aplicado aos filtros (preparado para Fase 3)
  // Se quisermos fazer os totais respeitarem os chips no futuro:
  // const statusRealizado = selectedStatuses?.filter(s => ['CONFIRMADO', 'CONCILIADO'].includes(s)) || ['CONFIRMADO', 'CONCILIADO']
  // const statusProjetado = selectedStatuses || ['PENDENTE', 'AGENDADO', 'CONFIRMADO', 'CONCILIADO']

  return {
    entradas,
    saidas,
    resultado: entradas - saidas,
    receitas,
    despesas,
    saldoInicial
  }
}
