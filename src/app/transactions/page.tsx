/**
 * 📄 Descrição: Página principal de lançamentos — listagem + filtros + formulário completo
 * 🧱 Contexto: Rota protegida /transactions — core financeiro da aplicação
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * 🔍 Dependências: Layout, TransactionService e CategoryService via API
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import {
  Plus, Pencil, Trash2, CheckCircle, RefreshCw,
  Filter, Search, TrendingUp, TrendingDown, ArrowLeftRight, ChevronDown
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface Account { id: string; name: string; type: string }
interface Category { id: string; name: string; type: 'RECEITA' | 'DESPESA' }
interface Transaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
  dueDate: string
  paymentDate?: string
  accountId?: string
  categoryId?: string
  notes?: string
  isRecurring: boolean
  account?: { name: string }
  category?: { name: string; type: string }
}

const TYPE_STYLES = {
  RECEITA: { label: 'Receita', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  DESPESA: { label: 'Despesa', icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
  TRANSFERENCIA: { label: 'Transferência', icon: ArrowLeftRight, color: 'text-blue-600', bg: 'bg-blue-50' },
}

const STATUS_STYLES = {
  PENDENTE: 'bg-yellow-100 text-yellow-700',
  CONFIRMADO: 'bg-green-100 text-green-700',
  CONCILIADO: 'bg-blue-100 text-blue-700',
}

const STATUS_LABELS = { PENDENTE: 'Pendente', CONFIRMADO: 'Confirmado', CONCILIADO: 'Conciliado' }

const emptyForm = {
  description: '',
  amount: '',
  type: 'DESPESA' as 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA',
  dueDate: new Date().toISOString().slice(0, 10),
  paymentDate: '',
  accountId: '',
  categoryId: '',
  notes: '',
  status: 'PENDENTE' as 'PENDENTE' | 'CONFIRMADO',
  regime: 'CAIXA' as 'CAIXA' | 'COMPETENCIA',
  recurrenceMode: 'SIMPLES' as 'SIMPLES' | 'PARCELADA' | 'FIXA',
  installments: '2',
  frequency: 'MENSAL' as 'SEMANAL' | 'MENSAL' | 'ANUAL',
  endDate: '',
  destinationAccountId: '',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (filterType) params.set('type', filterType)
      if (filterStatus) params.set('status', filterStatus)
      if (filterMonth) {
        const [y, m] = filterMonth.split('-')
        params.set('startDate', `${y}-${m}-01T00:00:00.000Z`)
        const lastDay = new Date(Number(y), Number(m), 0).getDate()
        params.set('endDate', `${y}-${m}-${lastDay}T23:59:59.000Z`)
      }
      if (search) params.set('search', search)

      const [txRes, accRes, catRes] = await Promise.all([
        fetch(`/api/transactions?${params}`),
        fetch('/api/accounts'),
        fetch('/api/categories'),
      ])
      if (!txRes.ok) throw new Error()
      const [txData, accData, catData] = await Promise.all([
        txRes.json(), accRes.json(), catRes.json()
      ])
      setTransactions(Array.isArray(txData.transactions) ? txData.transactions : txData)
      setAccounts(Array.isArray(accData) ? accData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch {
      setError('Não foi possível carregar os lançamentos.')
    } finally {
      setLoading(false)
    }
  }, [filterType, filterStatus, filterMonth, search])

  useEffect(() => { fetchData() }, [fetchData])

  const filteredCategories = categories.filter(c =>
    form.type === 'TRANSFERENCIA' ? false :
    form.type === 'RECEITA' ? c.type === 'RECEITA' : c.type === 'DESPESA'
  )

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (tx: Transaction) => {
    setEditId(tx.id)
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      dueDate: tx.dueDate?.slice(0, 10) || '',
      paymentDate: tx.paymentDate?.slice(0, 10) || '',
      accountId: tx.accountId || '',
      categoryId: tx.categoryId || '',
      notes: tx.notes || '',
      status: tx.status === 'CONFIRMADO' ? 'CONFIRMADO' : 'PENDENTE',
      regime: 'CAIXA',
      recurrenceMode: 'SIMPLES',
      installments: '2',
      frequency: 'MENSAL',
      endDate: '',
      destinationAccountId: '',
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) {
      setFormError('Valor deve ser maior que zero.')
      setSaving(false)
      return
    }

    try {
      let url = '/api/transactions'
      let method = 'POST'
      const body: any = {
        description: form.description,
        amount,
        type: form.type,
        dueDate: new Date(form.dueDate + 'T12:00:00.000Z').toISOString(),
        paymentDate: form.paymentDate ? new Date(form.paymentDate + 'T12:00:00.000Z').toISOString() : undefined,
        accountId: form.accountId || undefined,
        categoryId: form.categoryId || undefined,
        notes: form.notes || undefined,
        status: form.status,
        regime: form.regime,
      }

      if (!editId && form.recurrenceMode === 'PARCELADA') {
        body.recurrenceData = {
          type: 'PARCELADA',
          totalInstallments: parseInt(form.installments),
          firstDueDate: new Date(form.dueDate + 'T12:00:00.000Z').toISOString(),
        }
      } else if (!editId && form.recurrenceMode === 'FIXA') {
        body.recurrenceData = {
          type: 'FIXA',
          frequency: form.frequency,
          endDate: form.endDate ? new Date(form.endDate + 'T12:00:00.000Z').toISOString() : undefined,
        }
      } else if (!editId && form.type === 'TRANSFERENCIA') {
        body.transferData = { destinationAccountId: form.destinationAccountId }
      }

      if (editId) {
        url = `/api/transactions/${editId}`
        method = 'PUT'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar lançamento')
      }
      setShowForm(false)
      fetchData()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async (tx: Transaction) => {
    const action = tx.status === 'PENDENTE' ? 'confirm' : 'reconcile'
    try {
      await fetch(`/api/transactions/${tx.id}?action=${action}`, { method: 'PATCH' })
      fetchData()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
        return
      }
      setDeleteConfirm(null)
      fetchData()
    } catch { }
  }

  const totalReceitas = transactions.filter(t => t.type === 'RECEITA').reduce((s, t) => s + t.amount, 0)
  const totalDespesas = transactions.filter(t => t.type === 'DESPESA').reduce((s, t) => s + t.amount, 0)
  const saldo = totalReceitas - totalDespesas

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lançamentos</h1>
            <p className="text-sm text-gray-500 mt-1">Receitas, despesas e transferências</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Novo Lançamento
            </button>
          </div>
        </div>

        {/* Resumo */}
        {!loading && transactions.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 font-medium">Receitas</p>
              <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(totalReceitas)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-600 font-medium">Despesas</p>
              <p className="text-lg font-bold text-red-700 mt-1">{formatCurrency(totalDespesas)}</p>
            </div>
            <div className={`${saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-xl p-4`}>
              <p className={`text-xs font-medium ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo</p>
              <p className={`text-lg font-bold mt-1 ${saldo >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(saldo)}</p>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text" placeholder="Buscar descrição..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <input
              type="month" value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-3 py-2 border rounded-lg text-sm ${showFilters ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              <Filter className="h-4 w-4" /> Filtros
              <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <select
                value={filterType} onChange={e => setFilterType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos os tipos</option>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
                <option value="TRANSFERENCIA">Transferência</option>
              </select>
              <select
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Todos os status</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CONFIRMADO">Confirmado</option>
                <option value="CONCILIADO">Conciliado</option>
              </select>
              <button
                onClick={() => { setFilterType(''); setFilterStatus(''); setSearch('') }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={fetchData} className="text-red-600 text-sm font-medium hover:underline">Tentar novamente</button>
          </div>
        )}
        {!loading && !error && transactions.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <ArrowLeftRight className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-gray-500 font-medium">Nenhum lançamento encontrado</h3>
            <p className="text-gray-400 text-sm mt-1">Crie seu primeiro lançamento ou ajuste os filtros</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Novo Lançamento
            </button>
          </div>
        )}

        {/* Tabela */}
        {!loading && !error && transactions.length > 0 && (
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Conta</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimento</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map(tx => {
                    const style = TYPE_STYLES[tx.type]
                    const Icon = style.icon
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${style.bg}`}>
                              <Icon className={`h-3.5 w-3.5 ${style.color}`} />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 truncate max-w-[180px]">{tx.description}</p>
                              {tx.notes && <p className="text-xs text-gray-400 truncate max-w-[180px]">{tx.notes}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-gray-500 text-xs">{tx.category?.name || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-500 text-xs">{tx.account?.name || '—'}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDate(tx.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${style.color}`}>
                            {tx.type === 'DESPESA' ? '- ' : tx.type === 'RECEITA' ? '+ ' : ''}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden lg:table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[tx.status]}`}>
                            {STATUS_LABELS[tx.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {tx.status === 'PENDENTE' && (
                              <button onClick={() => handleConfirm(tx)} title="Confirmar" className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition">
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button onClick={() => openEdit(tx)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setDeleteConfirm(tx.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['DESPESA', 'RECEITA', 'TRANSFERENCIA'] as const).map(t => {
                    const s = TYPE_STYLES[t]
                    const Icon = s.icon
                    return (
                      <button
                        key={t} type="button"
                        onClick={() => setForm(p => ({ ...p, type: t, categoryId: '' }))}
                        className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 text-sm font-medium transition ${form.type === t ? `border-current ${s.color} ${s.bg}` : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                        <Icon className="h-4 w-4" /> {s.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
                <input
                  type="text" required maxLength={255}
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Supermercado, Salário, Aluguel..."
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input
                  type="number" required min="0.01" step="0.01"
                  value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="0,00"
                />
              </div>

              {/* Data vencimento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento *</label>
                  <input
                    type="date" required
                    value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data pagamento</label>
                  <input
                    type="date"
                    value={form.paymentDate} onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Conta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.type === 'TRANSFERENCIA' ? 'Conta origem' : 'Conta'}
                  </label>
                  <select
                    value={form.accountId} onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                {form.type === 'TRANSFERENCIA' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta destino</label>
                    <select
                      value={form.destinationAccountId} onChange={e => setForm(p => ({ ...p, destinationAccountId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecione</option>
                      {accounts.filter(a => a.id !== form.accountId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                    <select
                      value={form.categoryId} onChange={e => setForm(p => ({ ...p, categoryId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Sem categoria</option>
                      {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="CONFIRMADO">Confirmado</option>
                </select>
              </div>

              {/* Recorrência — somente criação */}
              {!editId && form.type !== 'TRANSFERENCIA' && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Repetição</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['SIMPLES', 'PARCELADA', 'FIXA'] as const).map(m => (
                      <button
                        key={m} type="button"
                        onClick={() => setForm(p => ({ ...p, recurrenceMode: m }))}
                        className={`py-1.5 rounded-lg border text-xs font-medium transition ${form.recurrenceMode === m ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                      >
                        {m === 'SIMPLES' ? 'Simples' : m === 'PARCELADA' ? 'Parcelada' : 'Fixa'}
                      </button>
                    ))}
                  </div>

                  {form.recurrenceMode === 'PARCELADA' && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Número de parcelas</label>
                      <input
                        type="number" min="2" max="360"
                        value={form.installments} onChange={e => setForm(p => ({ ...p, installments: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {form.amount && (
                        <p className="text-xs text-gray-400 mt-1">
                          {parseInt(form.installments) || 1}x de {formatCurrency(parseFloat(form.amount) / (parseInt(form.installments) || 1))}
                        </p>
                      )}
                    </div>
                  )}

                  {form.recurrenceMode === 'FIXA' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Frequência</label>
                        <select
                          value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value as any }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="SEMANAL">Semanal</option>
                          <option value="MENSAL">Mensal</option>
                          <option value="ANUAL">Anual</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Data fim (opcional)</label>
                        <input
                          type="date"
                          value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={2} maxLength={1000}
                  value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Observação opcional..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center space-y-4">
            <Trash2 className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="text-lg font-bold text-gray-900">Excluir lançamento?</h2>
            <p className="text-sm text-gray-500">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
