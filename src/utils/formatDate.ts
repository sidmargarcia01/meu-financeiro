/**
 * CAMADA: Util
 * MÓDULO: Formatting
 * RESPONSABILIDADE: Formatar datas para exibição na UI
 * NÃO DEVE: Conter regras de negócio, calcular prazos financeiros ou aplicar regime de competência
 * DEPENDE DE: Intl (nativo do browser/Node)
 */

function isValidDate(d: Date): boolean {
  return d instanceof Date && !isNaN(d.getTime())
}

export function formatDate(
  date: string | Date | null | undefined,
  locale = 'pt-BR'
): string {
  if (!date) return '—'
  const d = new Date(date)
  if (!isValidDate(d)) return '—'
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d)
}

export function formatMonthYear(mes: number, ano: number, locale = 'pt-BR'): string {
  const d = new Date(ano, mes - 1)
  if (!isValidDate(d)) return '—'
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric'
  }).format(d)
}

export function getDaysFromToday(date: string | null | undefined): number {
  if (!date) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  if (!isValidDate(target)) return 0
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatRelativeDay(date: string | null | undefined): string {
  if (!date) return '—'
  const days = getDaysFromToday(date)
  if (days === 0) return 'hoje'
  if (days === 1) return 'amanhã'
  if (days === -1) return 'ontem'
  if (days > 0) return `+${days}d`
  return `${days}d`
}

export function formatRelativeDayLabel(date: string | null | undefined): string {
  if (!date) return '—'
  const days = getDaysFromToday(date)
  if (days === 0) return 'Vence hoje'
  if (days > 0) return `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`
  return `Vencido há ${Math.abs(days)} ${Math.abs(days) === 1 ? 'dia' : 'dias'}`
}
