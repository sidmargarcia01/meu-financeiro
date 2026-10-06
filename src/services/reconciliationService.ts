import { queryAll } from '@/lib/queryAll'
import { signedAmount } from '@/lib/financial'
/**
 * 📄 Descrição: Serviço de Conciliação Bancária — parse OFX e matching de transações
 * 🧱 Contexto: Módulo de conciliação do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: TypeScript, Supabase
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/requestSupabase'
import { transactionRepository } from '@/repositories/transactionRepository'
import { accountRepository } from '@/repositories/accountRepository'

export interface OFXTransaction {
  fitid: string
  dtposted: string
  trnamt: number
  trntype: 'CREDIT' | 'DEBIT' | 'OTHER'
  memo: string
  matched?: boolean
  matchedTxId?: string
}

export interface ReconciliationMatch {
  ofxTransaction: OFXTransaction
  suggestion?: { id: string; description: string; amount: number; dueDate: string }
  status: 'matched' | 'unmatched' | 'ignored'
}

export class ReconciliationService {
  /**
   * Parse OFX file content — suporte ao formato SGML (OFX 1.x) e XML (OFX 2.x)
   */
  parseOFX(content: string): OFXTransaction[] {
    const transactions: OFXTransaction[] = []

    // Normalizar quebras de linha
    const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Extrair blocos STMTTRN
    const stmtPattern = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match: RegExpExecArray | null

    while ((match = stmtPattern.exec(normalized)) !== null) {
      const block = match[1]
      const get = (tag: string) => {
        const m = new RegExp(`<${tag}>([^<\n]+)`, 'i').exec(block)
        return m ? m[1].trim() : ''
      }

      const fitid = get('FITID')
      const dtposted = get('DTPOSTED')
      const trnamt = parseFloat(get('TRNAMT').replace(',', '.'))
      const trntype = get('TRNTYPE').toUpperCase()
      const memo = get('MEMO') || get('NAME') || ''

      if (!fitid || isNaN(trnamt)) continue

      // Converter data OFX (YYYYMMDD[HH:MM:SS]) para ISO
      const year = dtposted.slice(0, 4)
      const month = dtposted.slice(4, 6)
      const day = dtposted.slice(6, 8)
      const isoDate = `${year}-${month}-${day}`

      transactions.push({
        fitid,
        dtposted: isoDate,
        trnamt: Math.abs(trnamt),
        trntype: trnamt >= 0 ? 'CREDIT' : 'DEBIT',
        memo: memo.trim(),
      })
    }

    return transactions
  }

  /**
   * Encontrar sugestões de matching para cada transação OFX
   */
  async findMatches(userId: string, ofxTransactions: OFXTransaction[], accountId?: string): Promise<ReconciliationMatch[]> {
    if (ofxTransactions.length === 0) return []
    if (!accountId) throw new Error('Selecione a conta do extrato')

    const dates = ofxTransactions.map(t => t.dtposted)
    const minDate = dates.reduce((a, b) => (a < b ? a : b))
    const maxDate = dates.reduce((a, b) => (a > b ? a : b))

    const from = new Date(minDate + 'T00:00:00Z'); from.setUTCDate(from.getUTCDate() - 3)
    const until = new Date(maxDate + 'T00:00:00Z'); until.setUTCDate(until.getUTCDate() + 3)
    const { data: dbTransactions, error } = await queryAll(supabase
      .from('transactions')
      .select('id, description, amount, type, due_date, status')
      .eq('user_id', userId)
      .eq('account_id', accountId)
      .gte('due_date', from.toISOString().slice(0,10))
      .lte('due_date', until.toISOString().slice(0,10))
      .in('status', ['PENDENTE', 'CONFIRMADO']))
    if (error) throw error

    const db = dbTransactions || []
    const used = new Set<string>()
    const bankIds = new Set<string>()

    return ofxTransactions.map(ofx => {
      if (bankIds.has(ofx.fitid)) return { ofxTransaction: ofx, status: 'ignored' } as ReconciliationMatch
      bankIds.add(ofx.fitid)
      const expectedType = ofx.trntype === 'CREDIT' ? 'RECEITA' : 'DESPESA'

      // Tentativa de match: mesmo valor + tipo + data próxima (±3 dias)
      const ofxDate = new Date(ofx.dtposted)
      const suggestion = db.find(tx => {
        if (used.has(tx.id) || tx.type !== expectedType) return false
        if (Math.abs(Math.abs(tx.amount) - ofx.trnamt) > 0.01) return false
        const txDate = new Date(tx.due_date)
        const diff = Math.abs(ofxDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 3
      })

      if (suggestion) used.add(suggestion.id)
      return {
        ofxTransaction: ofx,
        suggestion: suggestion
          ? { id: suggestion.id, description: suggestion.description, amount: suggestion.amount, dueDate: suggestion.due_date }
          : undefined,
        status: suggestion ? 'matched' : 'unmatched',
      } as ReconciliationMatch
    })
  }

  /**
   * Marcar lançamento individual como CONCILIADO (via repository)
   * Regra: apenas CONFIRMADO pode ser conciliado
   */
  async conciliate(transactionId: string, userId: string) {
    const transaction = await transactionRepository.findById(transactionId, userId)
    if (!transaction) throw new Error('Lançamento não encontrado')
    if (transaction.status !== 'CONFIRMADO') {
      throw new Error('Apenas lançamentos CONFIRMADOS podem ser conciliados')
    }
    return transactionRepository.update(transactionId, userId, { status: 'CONCILIADO' })
  }

  /**
   * Retornar extrato de uma conta com saldo projetado e confirmado
   * Saldo Projetado = initial_balance + PENDENTE + CONFIRMADO + CONCILIADO
   * Saldo Confirmado = initial_balance + apenas CONFIRMADO + CONCILIADO
   */
  async getExtrato(
    userId: string,
    accountId: string,
    filters: { dateFrom?: string; dateTo?: string; status?: string }
  ) {
    const account = await accountRepository.findById(accountId, userId)
    if (!account) throw new Error('Conta não encontrada')

    const transactions = await transactionRepository.list(userId, {
      accountId,

    })

    const baseDate = account.initialBalanceDate ? new Date(account.initialBalanceDate).toISOString().slice(0,10) : undefined
    const initialBalance = (!baseDate || !filters.dateTo || baseDate <= filters.dateTo) ? account.initialBalance ?? 0 : 0
    const eligible = transactions.filter(tx => {
      const date = tx.status === 'PENDENTE' ? tx.due_date : tx.payment_date || tx.due_date
      return (!baseDate || date >= baseDate) && (!filters.dateTo || date <= filters.dateTo)
    })

    const saldo_projetado = eligible.reduce((acc, tx) => {
      const signal = tx.type === 'RECEITA' ? 1 : -1
      return acc + signedAmount(tx.type, tx.amount)
    }, initialBalance)

    const saldo_confirmado = eligible
      .filter(tx => ['CONFIRMADO', 'CONCILIADO'].includes(tx.status))
      .reduce((acc, tx) => {
        const signal = tx.type === 'RECEITA' ? 1 : -1
        return acc + signedAmount(tx.type, tx.amount)
      }, initialBalance)

    return { transactions: eligible.filter(t => (!filters.dateFrom || (t.payment_date || t.due_date) >= filters.dateFrom) && (!filters.status || t.status === filters.status)), saldo_projetado, saldo_confirmado, account }
  }

  /**
   * Confirmar conciliação: marcar transações como CONCILIADO
   */
  async confirmMatches(userId: string, matches: Array<{ id: string; fitid: string; date: string; amount: number }>, accountId: string): Promise<{ updated: number }> {
    if (!accountId) throw new Error('Conta obrigatória')
    if (new Set(matches.map(m => m.id)).size !== matches.length) throw new Error('Um lançamento não pode ser reutilizado')
    const { data, error } = await supabase.rpc('confirm_ofx_matches', { account: accountId, matches })
    if (error) throw error
    return { updated: Number(data || 0) }
  }

}

export const reconciliationService = new ReconciliationService()
