/**
 * 📄 CAMADA: Component
 * 🧱 MÓDULO: TransactionsList (Fase 4)
 * 📌 Contexto: Lista de lançamentos com UX melhorada (atrasados/dia/futuros)
 * ⚙️ Tecnologias: React, TailwindCSS, Lucide Icons
 * 🔍 Dependências: groupTransactionsBySections, Transaction type
 * ✅ Revisado: Sim - Fase 4 da refatoração de lançamentos
 */

'use client'

import React, { useMemo } from 'react'
import { AlertCircle, Calendar, Clock, ChevronRight } from 'lucide-react'
import { groupTransactionsBySections } from '@/utils/groupTransactionsBySections'
import type { Transaction as BaseTransaction } from '@/utils/calculateTotals'

// Extensão da interface para incluir description (usada na UI)
interface Transaction extends BaseTransaction {
  description?: string
}

interface TransactionsListProps {
  transactions: Transaction[]
  selectedDateStr: string
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
}

export function TransactionsList({
  transactions,
  selectedDateStr,
  onEdit,
  onDelete
}: TransactionsListProps) {
  const sections = useMemo(
    () => groupTransactionsBySections(transactions, selectedDateStr),
    [transactions, selectedDateStr]
  )

  // Estado vazio
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">
          Nenhum lançamento
        </h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Não há lançamentos para o período selecionado.
          <br />
          Clique em "Novo" para adicionar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section
          key={section.key}
          className={`rounded-lg border ${section.highlight
              ? 'border-amber-200 bg-amber-50/30'
              : section.key === 'currentDay'
                ? 'border-blue-200 bg-blue-50/20'
                : 'border-slate-200 bg-slate-50/30'
            }`}
          data-testid={`section-${section.key}`}
        >
          {/* Header da seção */}
          <div
            className={`px-4 py-3 border-b flex items-center justify-between ${section.highlight
                ? 'border-amber-200 bg-amber-100/50'
                : section.key === 'currentDay'
                  ? 'border-blue-200 bg-blue-100/30'
                  : 'border-slate-200 bg-slate-100/50'
              }`}
          >
            <div className="flex items-center gap-2">
              {section.key === 'overdue' && (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              {section.key === 'currentDay' && (
                <Calendar className="w-5 h-5 text-blue-600" />
              )}
              {section.key === 'future' && (
                <Clock className="w-5 h-5 text-slate-500" />
              )}
              <h3 className="font-semibold text-slate-800">
                {section.label}
              </h3>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${section.highlight
                  ? 'bg-amber-200 text-amber-800'
                  : section.key === 'currentDay'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
            >
              {section.subtitle}
            </span>
          </div>

          {/* Lista de itens */}
          <div className="divide-y divide-slate-100">
            {section.items.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm">
                Sem lançamentos para {formatDateBR(selectedDateStr)}
              </div>
            ) : (
              section.items.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onEdit={() => onEdit(tx)}
                  onDelete={() => onDelete(tx.id)}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Item individual de transação
 */
function TransactionItem({
  transaction,
  onEdit,
  onDelete
}: {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}) {
  const isReceita = transaction.type === 'RECEITA'
  const amount = Math.abs(transaction.amount || 0)

  const statusColors: Record<string, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-700',
    AGENDADO: 'bg-blue-100 text-blue-700',
    CONFIRMADO: 'bg-green-100 text-green-700',
    CONCILIADO: 'bg-emerald-100 text-emerald-700'
  }

  const statusLabel = statusColors[transaction.status] ? transaction.status : 'PENDENTE'

  return (
    <div
      className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-slate-800 truncate">
              {transaction.description || 'Sem descrição'}
            </p>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColors[transaction.status]
                }`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatDateBR(transaction.due_date)}
            {transaction.account_id && ` • Conta ${transaction.account_id.slice(0, 8)}...`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`font-semibold ${isReceita ? 'text-green-600' : 'text-red-600'
              }`}
          >
            {isReceita ? '+' : '-'} {formatCurrency(amount)}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
        </div>
      </div>
    </div>
  )
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

/**
 * Formata valor como moeda brasileira
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
