/**
 * 📄 Descrição: Página de configurações do usuário
 * 🧱 Contexto: Rota protegida /settings — 8 flags de comportamento + dados do perfil
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * 🔍 Dependências: Layout, /api/settings
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { Save, Settings, User, Shield, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface UserSettings {
  enableCompetenceDate: boolean
  requireCostCenter: boolean
  requireProject: boolean
  requireContact: boolean
  requireTag: boolean
  requireSubcategory: boolean
  installmentDefault: 'VALOR_PARCELA' | 'VALOR_TOTAL'
}

const defaultSettings: UserSettings = {
  enableCompetenceDate: false,
  requireCostCenter: false,
  requireProject: false,
  requireContact: false,
  requireTag: false,
  requireSubcategory: false,
  installmentDefault: 'VALOR_PARCELA',
}

function Toggle({
  label, description, checked, onChange
}: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error()
        const data = await res.json()
        setSettings(prev => ({ ...prev, ...data }))
      } catch {
        setError('Não foi possível carregar as configurações.')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erro ao salvar configurações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const set = (key: keyof UserSettings) => (value: boolean | string) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-sm text-gray-500 mt-1">Personalize o comportamento do sistema</p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && (
          <div className="space-y-6">
            {/* Perfil */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Perfil</h2>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ID</p>
                  <p className="text-xs text-gray-400 font-mono">{user?.id || '—'}</p>
                </div>
              </div>
            </div>

            {/* Lançamentos */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Settings className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Comportamento dos Lançamentos</h2>
              </div>

              <Toggle
                label="Regime de Competência"
                description="Habilita o campo 'Data de Competência' nos lançamentos para controle pelo regime de competência"
                checked={settings.enableCompetenceDate}
                onChange={set('enableCompetenceDate') as (v: boolean) => void}
              />
              <Toggle
                label="Centro de Custo obrigatório"
                description="Exige que um centro de custo seja selecionado ao criar lançamentos"
                checked={settings.requireCostCenter}
                onChange={set('requireCostCenter') as (v: boolean) => void}
              />
              <Toggle
                label="Projeto obrigatório"
                description="Exige que um projeto seja selecionado ao criar lançamentos"
                checked={settings.requireProject}
                onChange={set('requireProject') as (v: boolean) => void}
              />
              <Toggle
                label="Contato obrigatório"
                description="Exige que um contato (cliente/fornecedor) seja selecionado ao criar lançamentos"
                checked={settings.requireContact}
                onChange={set('requireContact') as (v: boolean) => void}
              />
              <Toggle
                label="Tag obrigatória"
                description="Exige que pelo menos uma tag seja selecionada ao criar lançamentos"
                checked={settings.requireTag}
                onChange={set('requireTag') as (v: boolean) => void}
              />
              <Toggle
                label="Subcategoria obrigatória"
                description="Exige uso de subcategorias em vez de categorias raiz"
                checked={settings.requireSubcategory}
                onChange={set('requireSubcategory') as (v: boolean) => void}
              />
            </div>

            {/* Parcelamento */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Parcelamento</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Padrão do campo Valor</label>
                <p className="text-xs text-gray-500 mb-3">Define se o valor informado no parcelamento representa cada parcela ou o total</p>
                <div className="flex gap-3">
                  {(['VALOR_PARCELA', 'VALOR_TOTAL'] as const).map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set('installmentDefault')(opt)}
                      className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition ${settings.installmentDefault === opt
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      {opt === 'VALOR_PARCELA' ? 'Valor da parcela' : 'Valor total'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Segurança</h2>
              </div>
              <p className="text-sm text-gray-500">
                Para alterar sua senha, utilize o link{' '}
                <a href="/recuperar-senha" className="text-indigo-600 hover:underline font-medium">Esqueci minha senha</a>{' '}
                na tela de login. Um email de redefinição será enviado.
              </p>
            </div>

            {/* Feedback */}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-lg">Configurações salvas com sucesso!</div>}

            {/* Botão Salvar */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
