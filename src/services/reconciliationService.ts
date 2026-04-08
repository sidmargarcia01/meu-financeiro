/**
 * 📄 Descrição: Serviço de Conciliação Bancária — parse OFX e matching de transações
 * 🧱 Contexto: Módulo de conciliação do Meu Financeiro
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: TypeScript, Supabase
 * ✅ Revisado: Sim
 */

import { supabase } from '@/lib/supabase'
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
  async findMatches(userId: string, ofxTransactions: OFXTransaction[]): Promise<ReconciliationMatch[]> {
    if (ofxTransactions.length === 0) return []

    const dates = ofxTransactions.map(t => t.dtposted)
    const minDate = dates.reduce((a, b) => (a < b ? a : b))
    const maxDate = dates.reduce((a, b) => (a > b ? a : b))

    const { data: dbTransactions } = await supabase
      .from('transactions')
      .select('id, description, amount, type, due_date, status')
      .eq('user_id', userId)
      .gte('due_date', minDate)
      .lte('due_date', maxDate)
      .in('status', ['PENDENTE', 'CONFIRMADO'])

    const db = dbTransactions || []

    return ofxTransactions.map(ofx => {
      const expectedType = ofx.trntype === 'CREDIT' ? 'RECEITA' : 'DESPESA'

      // Tentativa de match: mesmo valor + tipo + data próxima (±3 dias)
      const ofxDate = new Date(ofx.dtposted)
      const suggestion = db.find(tx => {
        if (tx.type !== expectedType) return false
        if (Math.abs(tx.amount - ofx.trnamt) > 0.01) return false
        const txDate = new Date(tx.due_date)
        const diff = Math.abs(ofxDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24)
        return diff <= 3
      })

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
      startDate: filters.dateFrom,
      endDate: filters.dateTo,
    })

    const initialBalance = (account as any).initialBalance ?? (account as any).initial_balance ?? 0

    const saldo_projetado = transactions.reduce((acc, tx) => {
      const signal = tx.type === 'RECEITA' ? 1 : -1
      return acc + tx.amount * signal
    }, initialBalance)

    const saldo_confirmado = transactions
      .filter(tx => ['CONFIRMADO', 'CONCILIADO'].includes(tx.status))
      .reduce((acc, tx) => {
        const signal = tx.type === 'RECEITA' ? 1 : -1
        return acc + tx.amount * signal
      }, initialBalance)

    return { transactions, saldo_projetado, saldo_confirmado, account }
  }

  /**
   * Confirmar conciliação: marcar transações como CONCILIADO
   */
  async confirmMatches(userId: string, matchIds: string[]): Promise<{ updated: number }> {
    if (matchIds.length === 0) return { updated: 0 }

    const { data, error } = await supabase
      .from('transactions')
      .update({ status: 'CONCILIADO', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', matchIds)
      .select('id')

    if (error) throw error
    return { updated: data?.length || 0 }
  }
}

export const reconciliationService = new ReconciliationService()
