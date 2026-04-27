/**
 * 📄 Descrição: Página de relatórios financeiros — DRE, DFC e Extrato
 * 🧱 Contexto: Rota protegida /reports — visualização e análise financeira
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * 🔍 Dependências: Layout, reportService via API
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { FileText, TrendingUp, CreditCard, Download, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

type ReportTab = 'dre' | 'dfc' | 'extrato'

interface DRELinha {
  descricao: string
  valor: number
  percentual?: number
  tipo: 'receita' | 'despesa' | 'subtotal' | 'total'
  nivel: number
}

interface DRERelatorio {
  periodo: { inicio: string; fim: string }
  regime: 'CAIXA' | 'COMPETENCIA'
  linhas: DRELinha[]
  totalReceitas: number
  totalDespesas: number
  resultado: number
}

interface DFCLinha {
  data: string
  descricao: string
  entrada: number
  saida: number
  saldo: number
  tipo: string
  status: string
  conta: string
  categoria?: string
}

interface DFCRelatorio {
  periodo: { inicio: string; fim: string }
  linhas: DFCLinha[]
  totalEntradas: number
  totalSaidas: number
  saldoFinal: number
}

interface ExtratoLinha {
  id: string
  data: string
  descricao: string
  valor: number
  tipo: string
  status: string
  categoria?: string
  conta: string
  saldoAcumulado: number
}

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('dre')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [dreData, setDreData] = useState<DRERelatorio | null>(null)
  const [dfcData, setDfcData] = useState<DFCRelatorio | null>(null)
  const [extratoData, setExtratoData] = useState<ExtratoLinha[] | null>(null)

  const [dreForm, setDreForm] = useState({
    inicio: `${currentYear}-01-01`,
    fim: new Date().toISOString().slice(0, 10),
    regime: 'CAIXA' as 'CAIXA' | 'COMPETENCIA',
  })

  const [dfcForm, setDfcForm] = useState({
    inicio: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
    fim: new Date().toISOString().slice(0, 10),
  })

  const [extratoForm, setExtratoForm] = useState({
    inicio: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
    fim: new Date().toISOString().slice(0, 10),
  })

  const gerarDRE = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        inicio: dreForm.inicio,
        fim: dreForm.fim,
        regime: dreForm.regime,
      })
      const res = await fetch(`/api/reports/dre?${params}`)
      if (!res.ok) throw new Error()
      setDreData(await res.json())
    } catch {
      setError('Erro ao gerar DRE.')
    } finally {
      setLoading(false)
    }
  }, [dreForm])

  const gerarDFC = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ inicio: dfcForm.inicio, fim: dfcForm.fim })
      const res = await fetch(`/api/reports/dfc?${params}`)
      if (!res.ok) throw new Error()
      setDfcData(await res.json())
    } catch {
      setError('Erro ao gerar DFC.')
    } finally {
      setLoading(false)
    }
  }, [dfcForm])

  const gerarExtrato = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ inicio: extratoForm.inicio, fim: extratoForm.fim })
      const res = await fetch(`/api/reports/extrato?${params}`)
      if (!res.ok) throw new Error()
      setExtratoData(await res.json())
    } catch {
      setError('Erro ao gerar extrato.')
    } finally {
      setLoading(false)
    }
  }, [extratoForm])

  const tabs = [
    { id: 'dre' as ReportTab, label: 'DRE', icon: FileText, desc: 'Demonstrativo de Resultado' },
    { id: 'dfc' as ReportTab, label: 'DFC', icon: TrendingUp, desc: 'Fluxo de Caixa' },
    { id: 'extrato' as ReportTab, label: 'Extrato', icon: CreditCard, desc: 'Extrato de Lançamentos' },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">Análises financeiras do seu negócio</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>
        )}

        {/* DRE */}
        {tab === 'dre' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Início</label>
                <input type="date" value={dreForm.inicio}
                  onChange={e => setDreForm(p => ({ ...p, inicio: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fim</label>
                <input type="date" value={dreForm.fim}
                  onChange={e => setDreForm(p => ({ ...p, fim: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Regime</label>
                <select value={dreForm.regime}
                  onChange={e => setDreForm(p => ({ ...p, regime: e.target.value as any }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="CAIXA">Caixa</option>
                  <option value="COMPETENCIA">Competência</option>
                </select>
              </div>
              <button onClick={gerarDRE} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Gerar DRE
              </button>
            </div>

            {dreData && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-gray-900">Demonstrativo de Resultado do Exercício</h2>
                    <p className="text-xs text-gray-500">{dreData.regime} — {formatDate(dreData.periodo.inicio)} a {formatDate(dreData.periodo.fim)}</p>
                  </div>
                </div>
                <div className="divide-y divide-gray-50">
                  {dreData.linhas.map((linha, i) => (
                    <div key={i}
                      className={`flex justify-between items-center px-6 py-3 ${linha.tipo === 'subtotal' ? 'bg-gray-50 font-semibold text-gray-700' : linha.tipo === 'total' ? 'bg-indigo-50 font-bold text-gray-900 border-t-2 border-indigo-200' : ''}`}
                      style={{ paddingLeft: `${24 + linha.nivel * 20}px` }}
                    >
                      <span className={`text-sm ${linha.tipo === 'total' ? 'text-base' : ''}`}>{linha.descricao}</span>
                      <div className="flex items-center gap-4">
                        {linha.percentual !== undefined && (
                          <span className="text-xs text-gray-400">{linha.percentual.toFixed(1)}%</span>
                        )}
                        <span className={`text-sm font-medium ${linha.valor === 0 ? 'text-gray-500' :
                            linha.tipo === 'receita' ? 'text-green-600' :
                              linha.tipo === 'despesa' ? 'text-red-600' :
                                linha.valor > 0 ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {linha.valor === 0 ? formatCurrency(0) : formatCurrency(Math.abs(linha.valor))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DFC */}
        {tab === 'dfc' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Início</label>
                <input type="date" value={dfcForm.inicio}
                  onChange={e => setDfcForm(p => ({ ...p, inicio: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fim</label>
                <input type="date" value={dfcForm.fim}
                  onChange={e => setDfcForm(p => ({ ...p, fim: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={gerarDFC} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
                Gerar DFC
              </button>
            </div>

            {dfcData && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4">
                    <p className="text-xs text-green-600">Total Entradas</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(dfcData.totalEntradas)}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs text-red-600">Total Saídas</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(dfcData.totalSaidas)}</p>
                  </div>
                  <div className={`${dfcData.saldoFinal >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-xl p-4`}>
                    <p className={`text-xs ${dfcData.saldoFinal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>Saldo Final</p>
                    <p className={`text-lg font-bold ${dfcData.saldoFinal >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(dfcData.saldoFinal)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Data</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Descrição</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Conta</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Entrada</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Saída</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Saldo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {dfcData.linhas.map((l, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.data)}</td>
                            <td className="px-4 py-3 text-gray-900">{l.descricao}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{l.conta}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-medium">{l.entrada > 0 ? formatCurrency(l.entrada) : '—'}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-medium">{l.saida > 0 ? formatCurrency(l.saida) : '—'}</td>
                            <td className={`px-4 py-3 text-right font-semibold ${l.saldo >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(l.saldo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Extrato */}
        {tab === 'extrato' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Início</label>
                <input type="date" value={extratoForm.inicio}
                  onChange={e => setExtratoForm(p => ({ ...p, inicio: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Fim</label>
                <input type="date" value={extratoForm.fim}
                  onChange={e => setExtratoForm(p => ({ ...p, fim: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={gerarExtrato} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Gerar Extrato
              </button>
            </div>

            {extratoData && (
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Data</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">Descrição</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden md:table-cell">Categoria</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 hidden lg:table-cell">Conta</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Valor</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {extratoData.map(l => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(l.data)}</td>
                          <td className="px-4 py-3 text-gray-900">{l.descricao}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">{l.categoria || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden lg:table-cell">{l.conta}</td>
                          <td className={`px-4 py-3 text-right font-medium ${l.valor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {l.valor >= 0 ? '+' : ''}{formatCurrency(l.valor)}
                          </td>
                          <td className={`px-4 py-3 text-right font-semibold ${l.saldoAcumulado >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                            {formatCurrency(l.saldoAcumulado)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
