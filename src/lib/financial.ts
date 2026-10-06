/** Amount convention: income positive, expense negative; transfers preserve direction. */
export function signedAmount(type: string, amount: number): number {
  if (!Number.isFinite(Number(amount))) throw new Error('Valor financeiro inválido')
  return type === 'DESPESA' ? -Math.abs(Number(amount))
    : type === 'RECEITA' ? Math.abs(Number(amount)) : Number(amount)
}

export function todayInBrazil(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now)
  const part = (type: string) => parts.find(p=>p.type===type)!.value
  return `${part('year')}-${part('month')}-${part('day')}`
}

export function addMonthsClamped(value: string | Date, months: number): Date {
  const source = typeof value === 'string' ? new Date(value.slice(0, 10) + 'T00:00:00Z') : value
  if (!Number.isFinite(source.getTime())) throw new Error('Data inválida')
  const first = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + months, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  first.setUTCDate(Math.min(source.getUTCDate(), lastDay))
  return first
}

export function splitCents(total: number, count: number): number[] {
  if (!Number.isInteger(count) || count < 2 || count > 600 || !Number.isFinite(total) || total <= 0) {
    throw new Error('Valor ou número de parcelas inválido')
  }
  const cents = Math.round(total * 100)
  if (cents < count) throw new Error('Cada parcela deve ter pelo menos um centavo')
  const base = Math.floor(cents / count)
  return Array.from({ length: count }, (_, i) => (base + (i < cents % count ? 1 : 0)) / 100)
}
