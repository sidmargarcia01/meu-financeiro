/**
 * 📄 Descrição: Página de investimentos — portfólio e cadastro de ativos
 * 🧱 Contexto: Rota protegida /investments — gestão de carteira financeira
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Plus, Pencil, Trash2, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'

interface Investment {
  id: string
  name: string
  type: string
  ticker?: string
  quantity: number
  averagePrice: number
  currentPrice?: number
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
  broker?: string
  currency: string
  isActive: boolean
}

interface Portfolio {
  totalInvested: number
  currentValue: number
  profitLoss: number
  profitLossPercent: number
  byType: { type: string; total: number; percentual: number }[]
  investments: Investment[]
}

const TYPE_LABELS: Record<string, string> = {
  ACOES: 'Ações', FII: 'FIIs', RENDA_FIXA: 'Renda Fixa',
  CRIPTOMOEDA: 'Criptomoedas', FUNDO: 'Fundos', OUTRO: 'Outros',
}

const TYPE_COLORS: Record<string, string> = {
  ACOES: 'bg-blue-100 text-blue-700', FII: 'bg-purple-100 text-purple-700',
  RENDA_FIXA: 'bg-green-100 text-green-700', CRIPTOMOEDA: 'bg-orange-100 text-orange-700',
  FUNDO: 'bg-indigo-100 text-indigo-700', OUTRO: 'bg-gray-100 text-gray-700',
}

const emptyForm = {
  name: '', type: 'ACOES', ticker: '', quantity: '', averagePrice: '',
  currentPrice: '', broker: '', currency: 'BRL',
}

export default function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [tab, setTab] = useState<'portfolio' | 'list'>('portfolio')

  const fetchPortfolio = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/investments?portfolio=true')
      if (!res.ok) throw new Error()
      setPortfolio(await res.json())
    } catch {
      setError('Não foi possível carregar o portfólio.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPortfolio() }, [fetchPortfolio])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForm)
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (inv: Investment) => {
    setEditId(inv.id)
    setForm({
      name: inv.name, type: inv.type,
      ticker: inv.ticker || '',
      quantity: String(inv.quantity),
      averagePrice: String(inv.averagePrice),
      currentPrice: inv.currentPrice ? String(inv.currentPrice) : '',
      broker: inv.broker || '',
      currency: inv.currency,
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const body = {
        name: form.name, type: form.type,
        ticker: form.ticker || undefined,
        quantity: parseFloat(form.quantity),
        averagePrice: parseFloat(form.averagePrice),
        currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : undefined,
        broker: form.broker || undefined,
        currency: form.currency,
      }
      const url = editId ? `/api/investments/${editId}` : '/api/investments'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao salvar')
      }
      setShowForm(false)
      fetchPortfolio()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/investments/${id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      fetchPortfolio()
    } catch { }
  }

  const investments = portfolio?.investments ?? []

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Investimentos</h1>
            <p className="text-sm text-gray-500 mt-1">Gerencie sua carteira de investimentos</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchPortfolio} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Plus className="h-4 w-4" /> Novo Ativo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {(['portfolio', 'list'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t === 'portfolio' ? 'Resumo' : 'Ativos'}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>}

        {!loading && !error && (
          <>
            {tab === 'portfolio' && portfolio && (
              <div className="space-y-4">
                {/* Cards de resumo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500">Total Investido</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(portfolio.totalInvested)}</p>
                  </div>
                  <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500">Valor Atual</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(portfolio.currentValue)}</p>
                  </div>
                  <div className={`${portfolio.profitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-xl border border-current border-opacity-10 p-4`}>
                    <p className={`text-xs ${portfolio.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>Lucro/Prejuízo</p>
                    <div className="flex items-center gap-1 mt-1">
                      {portfolio.profitLoss >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
                      <p className={`text-lg font-bold ${portfolio.profitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(portfolio.profitLoss)}</p>
                    </div>
                  </div>
                  <div className={`${portfolio.profitLossPercent >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-xl border border-current border-opacity-10 p-4`}>
                    <p className={`text-xs ${portfolio.profitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>Rentabilidade</p>
                    <p className={`text-lg font-bold mt-1 ${portfolio.profitLossPercent >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {portfolio.profitLossPercent >= 0 ? '+' : ''}{portfolio.profitLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Por tipo */}
                {portfolio.byType.length > 0 && (
                  <div className="bg-white rounded-xl border p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Alocação por Tipo</h3>
                    <div className="space-y-3">
                      {portfolio.byType.map(bt => (
                        <div key={bt.type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{bt.type}</span>
                            <span className="text-gray-500">{formatCurrency(bt.total)} <span className="text-gray-400">({bt.percentual.toFixed(1)}%)</span></span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${bt.percentual}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === 'list' && (
              <>
                {investments.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-gray-500 font-medium">Nenhum ativo cadastrado</h3>
                    <button onClick={openCreate} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Adicionar Ativo</button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Ativo</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden sm:table-cell">Qtd</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">P.Médio</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Investido</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Atual</th>
                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">L/P</th>
                            <th className="px-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {investments.map(inv => (
                            <tr key={inv.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[inv.type] || TYPE_COLORS.OUTRO}`}>
                                    {TYPE_LABELS[inv.type] || inv.type}
                                  </span>
                                  <div>
                                    <p className="font-medium text-gray-900">{inv.name}</p>
                                    {inv.ticker && <p className="text-xs text-gray-400">{inv.ticker}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-gray-500 hidden sm:table-cell">{inv.quantity}</td>
                              <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{formatCurrency(inv.averagePrice)}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.totalInvested)}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.currentValue)}</td>
                              <td className={`px-4 py-3 text-right font-medium hidden lg:table-cell ${inv.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {inv.profitLoss >= 0 ? '+' : ''}{inv.profitLossPercent.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-1 justify-end">
                                  <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => setDeleteConfirm(inv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Editar Ativo' : 'Novo Ativo'}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Tesouro Selic, PETR4, Bitcoin..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ticker</label>
                  <input type="text" value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value.toUpperCase() }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: PETR4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade *</label>
                  <input type="number" required step="any" min="0" value={form.quantity}
                    onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço médio *</label>
                  <input type="number" required step="0.01" min="0" value={form.averagePrice}
                    onChange={e => setForm(p => ({ ...p, averagePrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço atual</label>
                  <input type="number" step="0.01" min="0" value={form.currentPrice}
                    onChange={e => setForm(p => ({ ...p, currentPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Corretora</label>
                  <input type="text" value={form.broker} onChange={e => setForm(p => ({ ...p, broker: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: XP, Nubank..." />
                </div>
              </div>

              {form.quantity && form.averagePrice && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total investido</span>
                    <span className="font-medium">{formatCurrency(parseFloat(form.quantity) * parseFloat(form.averagePrice))}</span>
                  </div>
                  {form.currentPrice && (
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">Valor atual</span>
                      <span className="font-medium">{formatCurrency(parseFloat(form.quantity) * parseFloat(form.currentPrice))}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : editId ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 text-center space-y-4">
            <Trash2 className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="text-lg font-bold text-gray-900">Excluir ativo?</h2>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
