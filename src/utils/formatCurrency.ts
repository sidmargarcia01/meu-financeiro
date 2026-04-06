/**
 * CAMADA: Util
 * MÓDULO: Formatting
 * RESPONSABILIDADE: Formatar valores monetários para exibição na UI
 * NÃO DEVE: Conter lógica de negócio, calcular saldos ou aplicar regras financeiras
 * DEPENDE DE: Intl (nativo do browser/Node)
 */

export function formatCurrency(
  value: number,
  currency = 'BRL',
  locale = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

export function formatCurrencyCompact(value: number, currency = 'BRL'): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''

  if (abs >= 1_000_000) {
    return `${sign}R$ ${(abs / 1_000_000).toFixed(1)}M` 
  }
  if (abs >= 1_000) {
    return `${sign}R$ ${(abs / 1_000).toFixed(1)}K` 
  }
  return formatCurrency(value, currency)
}

export function isNegative(value: number): boolean {
  return value < 0
}
