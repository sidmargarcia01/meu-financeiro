/**
 * 📄 Descrição: Página de listagem e gestão de contas bancárias
 * 🧱 Contexto: Rota protegida /registers/accounts
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * 🔍 Dependências: Layout, AccountService via API
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import {
  Plus, Pencil, Archive, Trash2, CreditCard,
  Wallet, TrendingUp, Building2, PiggyBank, RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

interface Account {
  id: string
  name: string
  type: 'CORRENTE' | 'POUPANCA' | 'INVESTIMENTO' | 'CARTAO' | 'CARTEIRA'
  currency: string
  isActive: boolean
  initialBalance: number
  icon?: string
  currentBalance?: number
  projectedBalance?: number
  confirmedBalance?: number
}

const ACCOUNT_TYPE_LABELS: Record<Account['type'], string> = {
  CORRENTE: 'Conta Corrente',
  POUPANCA: 'Poupança',
  INVESTIMENTO: 'Investimento',
  CARTAO: 'Cartão de Crédito',
  CARTEIRA: 'Carteira',
}

const ACCOUNT_TYPE_ICONS: Record<Account['type'], React.ReactNode> = {
  CORRENTE: <Building2 className="h-5 w-5" />,
  POUPANCA: <PiggyBank className="h-5 w-5" />,
  INVESTIMENTO: <TrendingUp className="h-5 w-5" />,
  CARTAO: <CreditCard className="h-5 w-5" />,
  CARTEIRA: <Wallet className="h-5 w-5" />,
}

const ACCOUNT_TYPE_COLORS: Record<Account['type'], string> = {
  CORRENTE: 'bg-blue-100 text-blue-700',
  POUPANCA: 'bg-green-100 text-green-700',
  INVESTIMENTO: 'bg-purple-100 text-purple-700',
  CARTAO: 'bg-orange-100 text-orange-700',
  CARTEIRA: 'bg-gray-100 text-gray-700',
}

const emptyForm = {
  name: '', type: 'CORRENTE' as Account['type'],
  initialBalance: 0, currency: 'BRL', icon: '',
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/accounts?balances=true')
      if (!res.ok) throw new Error('Erro ao carregar contas')
      const data = await res.json()
      setAccounts(data)
    } catch {
      setError('Não foi possível carregar as contas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (account: Account) => {
    setEditId(account.id)
    setForm({
      name: account.name,
      type: account.type,
      initialBalance: account.initialBalance,
      currency: account.currency,
      icon: account.icon || '',
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const url = editId ? `/api/accounts/${editId}` : '/api/accounts'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, initialBalance: Number(form.initialBalance) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar conta')
      }
      setShowForm(false)
      fetchAccounts()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (account: Account) => {
    try {
      await fetch(`/api/accounts/${account.id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !account.isActive }),
      })
      fetchAccounts()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir conta')
        return
      }
      setDeleteConfirm(null)
      fetchAccounts()
    } catch { }
  }

  const filtered = accounts.filter(a => showInactive ? true : a.isActive)
  const totalBalance = filtered.reduce((sum, a) => sum + (a.confirmedBalance ?? 0), 0)

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contas Bancárias</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie suas contas e carteiras financeiras</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchAccounts} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Nova Conta
            </button>
          </div>
        </div>

        {/* Saldo Total */}
        {!loading && filtered.length > 0 && (
          <div className="bg-indigo-600 text-white rounded-xl p-6">
            <p className="text-indigo-200 text-sm">Saldo total consolidado</p>
            <p className={`text-3xl font-bold mt-1 ${totalBalance < 0 ? 'text-red-300' : ''}`}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-indigo-200 text-xs mt-1">{filtered.length} conta{filtered.length !== 1 ? 's' : ''} ativa{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* Filtro */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600"
            />
            Mostrar contas inativas
          </label>
        </div>

        {/* Estados */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-700 text-sm">{error}</span>
            <button onClick={fetchAccounts} className="text-red-600 text-sm font-medium hover:underline">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <Wallet className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-gray-500 font-medium">Nenhuma conta encontrada</h3>
            <p className="text-gray-400 text-sm mt-1">Crie sua primeira conta para começar</p>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Nova Conta
            </button>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(account => (
              <div
                key={account.id}
                className={`bg-white rounded-xl border p-5 space-y-3 transition-shadow hover:shadow-md ${!account.isActive ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${ACCOUNT_TYPE_COLORS[account.type]}`}>
                      {ACCOUNT_TYPE_ICONS[account.type]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <span className="text-xs text-gray-400">{ACCOUNT_TYPE_LABELS[account.type]}</span>
                    </div>
                  </div>
                  {!account.isActive && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inativa</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Confirmado</span>
                    <span className={`font-medium ${(account.confirmedBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(account.confirmedBalance ?? 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Projetado</span>
                    <span className={`font-medium ${(account.projectedBalance ?? 0) < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {formatCurrency(account.projectedBalance ?? 0)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 pt-2 border-t border-gray-100">
                  <button onClick={() => openEdit(account)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                  <button onClick={() => handleArchive(account)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition">
                    <Archive className="h-3.5 w-3.5" /> {account.isActive ? 'Arquivar' : 'Ativar'}
                  </button>
                  <button onClick={() => setDeleteConfirm(account.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Editar Conta' : 'Nova Conta'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da conta *</label>
                <input
                  type="text" required maxLength={100}
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Nubank, Bradesco..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as Account['type'] }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
                <input
                  type="number" step="0.01"
                  value={form.initialBalance} onChange={e => setForm(p => ({ ...p, initialBalance: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar conta'}
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
            <h2 className="text-lg font-bold text-gray-900">Excluir conta?</h2>
            <p className="text-sm text-gray-500">Esta ação não poderá ser desfeita. A conta só pode ser excluída se não houver lançamentos vinculados.</p>
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
