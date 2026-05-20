/**
 * 📄 Descrição: Filtra transações para exibição na lista de lançamentos
 * 🧱 Contexto: Tela de lançamentos de caixa - regra de negócio por data
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-26
 * ⚙️ Tecnologias: TypeScript
 * 🔍 Dependências: Interface Transaction
 * ✅ Revisado: Sim
 *
 * Regra de negócio:
 * - D < today:  apenas due_date === D (qualquer status)
 * - D === today: pendentes em aberto (due_date <= today, status PENDENTE) + transações do dia
 * - D > today:  apenas due_date === D (qualquer status)
 */

/**
 * Tipo mínimo de transação necessário para o filtro.
 * Compatível com a interface Transaction do page.tsx
 */
interface TransactionMinimal {
  id: string
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO' | string
  due_date: string
  payment_date?: string
}

/** Para CONCILIADO, usa payment_date como data efetiva; caso contrário usa due_date */
function effectiveDate(tx: TransactionMinimal): string {
  return tx.status === 'CONCILIADO' && tx.payment_date ? tx.payment_date : tx.due_date
}

/**
 * Filtra transações para exibição na lista conforme regra de negócio.
 *
 * @returns Transações que devem aparecer na lista
 */
export function filterTransactionsForList<T extends TransactionMinimal>(
  transactions: T[],
  selectedDateStr: string,
  todayStr: string
): T[] {
  const isBeforeToday = selectedDateStr < todayStr
  const isToday = selectedDateStr === todayStr
  const isAfterToday = selectedDateStr > todayStr

  if (isBeforeToday || isAfterToday) {
    // D < hoje OU D > hoje: mostrar apenas lançamentos do dia D (data efetiva)
    return transactions.filter(tx => effectiveDate(tx) === selectedDateStr)
  }

  if (isToday) {
    // D === hoje: mostrar pendentes em aberto (due_date <= hoje) + transações do dia
    return transactions.filter(tx => {
      const isPendingOpen = tx.status === 'PENDENTE' && tx.due_date <= todayStr
      const isTodayTransaction = effectiveDate(tx) === selectedDateStr
      return isPendingOpen || isTodayTransaction
    })
  }

  // Fallback (não deveria acontecer)
  return transactions
}

/**
 * Retorna o label de data para exibição.
 * "hoje" apenas quando due_date === todayStr (data real do sistema).
 */
export function getDisplayDateLabel(dueDate: string, todayStr: string): string {
  if (dueDate === todayStr) {
    return 'hoje'
  }

  const [year, month, day] = dueDate.split('-')
  return `${day}/${month}/${year.substring(2)}`
}
