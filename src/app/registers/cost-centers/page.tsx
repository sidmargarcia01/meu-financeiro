/**
 * 📄 Descrição: Página de Gestão Empresarial — Centros de Custo, Projetos, Contatos e Tags
 * 🧱 Contexto: Rota protegida /registers/cost-centers — cadastros complementares
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import {
  Plus, Pencil, Trash2, RefreshCw,
  Calculator, Target, Users, Tag as TagIcon
} from 'lucide-react'

type Section = 'cost-centers' | 'projects' | 'contacts' | 'tags'

interface GenericItem { id: string; name: string; [key: string]: any }

const SECTIONS = [
  { id: 'cost-centers' as Section, label: 'Centros de Custo', icon: Calculator, api: '/api/cost-centers', color: 'indigo' },
  { id: 'projects' as Section, label: 'Projetos', icon: Target, api: '/api/projects', color: 'purple' },
  { id: 'contacts' as Section, label: 'Contatos', icon: Users, api: '/api/contacts', color: 'blue' },
  { id: 'tags' as Section, label: 'Tags', icon: TagIcon, api: '/api/tags', color: 'pink' },
]

const PROJECT_STATUS_LABELS = { ATIVO: 'Ativo', CONCLUIDO: 'Concluído', CANCELADO: 'Cancelado' }
const CONTACT_TYPE_LABELS = { CLIENTE: 'Cliente', FORNECEDOR: 'Fornecedor', AMBOS: 'Ambos' }

const emptyForms: Record<Section, any> = {
  'cost-centers': { name: '', description: '', code: '' },
  'projects': { name: '', description: '', status: 'ATIVO', budget: '' },
  'contacts': { name: '', type: 'AMBOS', email: '', phone: '', document: '' },
  'tags': { name: '', color: '#6366f1' },
}

export default function BusinessManagementPage() {
  const [section, setSection] = useState<Section>('cost-centers')
  const [items, setItems] = useState<GenericItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForms['cost-centers'])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const currentSection = SECTIONS.find(s => s.id === section)!
  const api = currentSection.api

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(api)
      if (!res.ok) throw new Error()
      setItems(await res.json())
    } catch {
      setError('Não foi possível carregar os dados.')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    setItems([])
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    setEditId(null)
    setForm(emptyForms[section])
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (item: GenericItem) => {
    setEditId(item.id)
    setForm({
      name: item.name,
      description: item.description || '',
      code: item.code || '',
      status: item.status || 'ATIVO',
      budget: item.budget || '',
      type: item.type || 'AMBOS',
      email: item.email || '',
      phone: item.phone || '',
      document: item.document || '',
      color: item.color || '#6366f1',
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const url = editId ? `${api}/${editId}` : api
      const method = editId ? 'PUT' : 'POST'
      const body = { ...form }
      if (body.budget) body.budget = parseFloat(body.budget)
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }
      setShowForm(false)
      fetchItems()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${api}/${id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      fetchItems()
    } catch { }
  }

  const renderRow = (item: GenericItem) => {
    let badge: React.ReactNode = null
    let subtitle: string | undefined

    if (section === 'projects') {
      badge = <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.status === 'ATIVO' ? 'bg-green-100 text-green-700' : item.status === 'CONCLUIDO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>{PROJECT_STATUS_LABELS[item.status as keyof typeof PROJECT_STATUS_LABELS] || item.status}</span>
    }
    if (section === 'contacts') {
      badge = <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{CONTACT_TYPE_LABELS[item.type as keyof typeof CONTACT_TYPE_LABELS] || item.type}</span>
      subtitle = item.email || item.phone
    }
    if (section === 'cost-centers') {
      subtitle = item.code ? `Código: ${item.code}` : item.description
    }
    if (section === 'tags') {
      badge = <span className="inline-block h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: item.color || '#6366f1' }} />
    }

    return (
      <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {badge}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
            {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setDeleteConfirm(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão Empresarial</h1>
            <p className="text-sm text-gray-500 mt-1">Cadastros complementares para classificação de lançamentos</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchItems} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Plus className="h-4 w-4" /> Novo
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {SECTIONS.map(s => {
            const Icon = s.icon
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition ${section === s.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            )
          })}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">{error}</div>}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <currentSection.icon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-gray-500 font-medium">Nenhum item cadastrado</h3>
            <button onClick={openCreate} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Criar primeiro
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="bg-white rounded-xl border divide-y divide-gray-100">
            {items.map(renderRow)}
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editId ? 'Editar' : 'Novo'} {currentSection.label.slice(0, -1)}</h2>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" required value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {(section === 'cost-centers' || section === 'projects') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                  <input type="text" value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              {section === 'cost-centers' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input type="text" value={form.code} onChange={e => setForm((p: any) => ({ ...p, code: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              {section === 'projects' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="ATIVO">Ativo</option>
                      <option value="CONCLUIDO">Concluído</option>
                      <option value="CANCELADO">Cancelado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orçamento (R$)</label>
                    <input type="number" step="0.01" value={form.budget} onChange={e => setForm((p: any) => ({ ...p, budget: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </>
              )}

              {section === 'contacts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.type} onChange={e => setForm((p: any) => ({ ...p, type: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="AMBOS">Ambos</option>
                      <option value="CLIENTE">Cliente</option>
                      <option value="FORNECEDOR">Fornecedor</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={form.email} onChange={e => setForm((p: any) => ({ ...p, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                      <input type="text" value={form.phone} onChange={e => setForm((p: any) => ({ ...p, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                </>
              )}

              {section === 'tags' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={form.color} onChange={e => setForm((p: any) => ({ ...p, color: e.target.value }))}
                      className="h-9 w-16 rounded border border-gray-300 cursor-pointer" />
                    <span className="text-sm text-gray-500">{form.color}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}
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
            <h2 className="text-lg font-bold text-gray-900">Excluir item?</h2>
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
