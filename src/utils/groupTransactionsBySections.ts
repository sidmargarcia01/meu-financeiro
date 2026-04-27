/**
 * CAMADA: Utils
 * MÓDULO: Group Transactions By Sections (Fase 4)
 * RESPONSABILIDADE: Agrupar transações em seções UX (atrasados/dia/futuros)
 * NÃO DEVE: Conter lógica de negócio ou cálculos financeiros
 * DEPENDE DE: Transaction type
 * 
 * FASE 4 - UX: Separar lançamentos por contexto temporal
 */

import type { Transaction } from './calculateTotals'

export type SectionKey = 'overdue' | 'currentDay' | 'future'

export interface TransactionSection {
  key: SectionKey
  label: string
  subtitle?: string
  items: Transaction[]
  highlight?: boolean // para destacar visualmente
}

/**
 * Agrupa transações em seções para melhor UX
 * 
 * @param transactions - Lista filtrada de transações
 * @param selectedDateStr - Data selecionada (YYYY-MM-DD)
 * @returns Seções ordenadas: [overdue, currentDay, future]
 */
export function groupTransactionsBySections(
  transactions: Transaction[],
  selectedDateStr: string
): TransactionSection[] {
  const sections: TransactionSection[] = []

  // Agrupar por categoria temporal
  const overdue: Transaction[] = []
  const currentDay: Transaction[] = []
  const future: Transaction[] = []

  transactions.forEach(tx => {
    if (tx.due_date < selectedDateStr) {
      overdue.push(tx)
    } else if (tx.due_date === selectedDateStr) {
      currentDay.push(tx)
    } else {
      future.push(tx)
    }
  })

  // Seção 1: Atrasados (mais importantes - vencidos)
  if (overdue.length > 0) {
    const formattedDate = formatDateBR(selectedDateStr)
    sections.push({
      key: 'overdue',
      label: `Atrasados até ${formattedDate}`,
      subtitle: `${overdue.length} lançamento${overdue.length > 1 ? 's' : ''} pendente${overdue.length > 1 ? 's' : ''}`,
      items: sortByDateDesc(overdue),
      highlight: true
    })
  }

  // Seção 2: Dia atual (selecionado)
  const formattedSelectedDate = formatDateBR(selectedDateStr)
  sections.push({
    key: 'currentDay',
    label: formattedSelectedDate,
    subtitle: currentDay.length > 0 
      ? `${currentDay.length} lançamento${currentDay.length > 1 ? 's' : ''}`
      : 'Sem lançamentos para o dia',
    items: sortByDateAsc(currentDay),
    highlight: false
  })

  // Seção 3: Futuros (após D)
  if (future.length > 0) {
    sections.push({
      key: 'future',
      label: `Futuros após ${formattedSelectedDate}`,
      subtitle: `${future.length} lançamento${future.length > 1 ? 's' : ''} agendado${future.length > 1 ? 's' : ''}`,
      items: sortByDateAsc(future),
      highlight: false
    })
  }

  return sections
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Ordena transações por data descendente (mais recentes primeiro)
 */
function sortByDateDesc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => 
    new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  )
}

/**
 * Ordena transações por data ascendente (mais antigas primeiro)
 */
function sortByDateAsc(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => 
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )
}
