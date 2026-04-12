/**
 * 📄 Descrição: Página de importação e conciliação bancária via OFX
 * 🧱 Contexto: Rota protegida /tools/import — upload e conciliação de extrato bancário
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef } from 'react'
import { Layout } from '@/components/Layout'
import {
  Upload, CheckCircle, XCircle, AlertCircle,
  RefreshCw, ChevronRight, Download
} from 'lucide-react'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface OFXTransaction {
  fitid: string
  dtposted: string
  trnamt: number
  trntype: 'CREDIT' | 'DEBIT' | 'OTHER'
  memo: string
}

interface ReconciliationMatch {
  ofxTransaction: OFXTransaction
  suggestion?: { id: string; description: string; amount: number; dueDate: string }
  status: 'matched' | 'unmatched' | 'ignored'
}

type Step = 'upload' | 'review' | 'done'

export default function ImportPage() {
  const [step, setStep] = useState<Step>('upload')
  const [matches, setMatches] = useState<ReconciliationMatch[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(0)
  const [error, setError] = useState('')
  const [parsing, setParsing] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileInfo({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    })
    setError('')
    setParsing(true)

    try {
      const content = await file.text()
      const res = await fetch('/api/reconciliation/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Erro ao processar arquivo')
      }
      const data = await res.json()
      setMatches(data.matches)

      // Pré-selecionar as transações que já têm sugestão
      const preSelected = new Set<string>()
      data.matches.forEach((m: ReconciliationMatch) => {
        if (m.suggestion) preSelected.add(m.suggestion.id)
      })
      setSelectedIds(preSelected)
      setStep('review')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = async () => {
    setConfirming(true)
    setError('')
    try {
      const ids = Array.from(selectedIds)
      const res = await fetch('/api/reconciliation/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) throw new Error('Erro ao confirmar conciliação')
      const data = await res.json()
      setConfirmed(data.updated)
      setStep('done')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setMatches([])
    setSelectedIds(new Set())
    setFileInfo(null)
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const matched = matches.filter(m => m.suggestion).length
  const unmatched = matches.filter(m => !m.suggestion).length

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importação de Lançamentos</h1>
          <p className="text-sm text-gray-500 mt-1">Importe extratos bancários no formato OFX para conciliar seus lançamentos</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2">
          {(['upload', 'review', 'done'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${step === s ? 'bg-indigo-600 text-white' : i < ['upload', 'review', 'done'].indexOf(step) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {i < ['upload', 'review', 'done'].indexOf(step) ? <CheckCircle className="h-4 w-4" /> : <span className="h-4 w-4 flex items-center justify-center text-xs">{i + 1}</span>}
                {s === 'upload' ? 'Upload' : s === 'review' ? 'Revisão' : 'Concluído'}
              </div>
              {i < 2 && <ChevronRight className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="bg-white rounded-xl border p-8">
            <label
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-12 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition group"
              htmlFor="ofx-upload"
            >
              {parsing ? (
                <RefreshCw className="h-12 w-12 text-indigo-400 animate-spin mb-4" />
              ) : (
                <Upload className="h-12 w-12 text-gray-300 group-hover:text-indigo-500 mb-4 transition" />
              )}
              <p className="text-gray-700 font-medium">{parsing ? 'Processando...' : 'Clique para selecionar ou arraste o arquivo OFX'}</p>
              <p className="text-gray-400 text-sm mt-1">Suporte a OFX 1.x e 2.x</p>
            </label>
            <input
              id="ofx-upload" type="file" accept=".ofx,.OFX"
              className="hidden" ref={fileRef} onChange={handleFileChange}
              disabled={parsing}
            />

            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Como funciona?</h3>
              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                <li>Exporte o extrato bancário no formato OFX pelo seu banco</li>
                <li>Faça o upload do arquivo aqui</li>
                <li>O sistema identifica automaticamente as correspondências com seus lançamentos</li>
                <li>Confirme os matches para marcar os lançamentos como conciliados</li>
              </ol>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            {fileInfo && (
              <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{fileInfo.name}</p>
                  <p className="text-xs text-gray-400">{fileInfo.size} — {matches.length} transação{matches.length !== 1 ? 'ões' : ''}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-green-600"><CheckCircle className="h-3.5 w-3.5" />{matched} com sugestão</span>
                  <span className="flex items-center gap-1 text-orange-500"><AlertCircle className="h-3.5 w-3.5" />{unmatched} sem match</span>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Transações do extrato</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedIds(new Set(matches.filter(m => m.suggestion).map(m => m.suggestion!.id)))}
                    className="text-xs text-indigo-600 hover:underline">Selec. todos matches</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setSelectedIds(new Set())} className="text-xs text-gray-500 hover:underline">Limpar</button>
                </div>
              </div>

              <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                {matches.map((m, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs ${m.ofxTransaction.trntype === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {m.ofxTransaction.trntype === 'CREDIT' ? '+' : '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{m.ofxTransaction.memo || 'Sem descrição'}</p>
                          <span className={`text-sm font-semibold ml-2 ${m.ofxTransaction.trntype === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                            {m.ofxTransaction.trntype === 'CREDIT' ? '+' : '-'}{formatCurrency(m.ofxTransaction.trnamt)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.ofxTransaction.dtposted)}</p>

                        {m.suggestion ? (
                          <div className="mt-2 flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            <span className="text-xs text-green-700">Match: {m.suggestion.description} — {formatCurrency(m.suggestion.amount)}</span>
                            <button
                              onClick={() => toggleSelect(m.suggestion!.id)}
                              className={`ml-auto text-xs px-2 py-0.5 rounded-full border transition ${selectedIds.has(m.suggestion.id) ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:border-green-400'}`}
                            >
                              {selectedIds.has(m.suggestion.id) ? 'Selecionado' : 'Selecionar'}
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                            <span className="text-xs text-orange-600">Sem lançamento correspondente</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={confirming || selectedIds.size === 0}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {confirming ? 'Conciliando...' : `Confirmar ${selectedIds.size} conciliação${selectedIds.size !== 1 ? 'ões' : ''}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 'done' && (
          <div className="bg-white rounded-xl border p-12 text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="text-xl font-bold text-gray-900">Conciliação concluída!</h2>
            <p className="text-gray-500">{confirmed} lançamento{confirmed !== 1 ? 's foram marcados' : ' foi marcado'} como conciliado{confirmed !== 1 ? 's' : ''}.</p>
            <button onClick={reset} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Importar outro arquivo
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
