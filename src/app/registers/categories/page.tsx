/**
 * 📄 Descrição: Página de listagem e gestão de categorias com hierarquia
 * 🧱 Contexto: Rota protegida /registers/categories
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-06
 * ⚙️ Tecnologias: Next.js, React, TailwindCSS, TypeScript
 * 🔍 Dependências: Layout, CategoryService via API
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { Layout } from '@/components/Layout'
import { Plus, Pencil, Trash2, Tag, RefreshCw, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  type: 'RECEITA' | 'DESPESA'
  color?: string
  icon?: string
  parentId?: string
  isActive: boolean
  description?: string
  children?: Category[]
}

const TYPE_COLORS = {
  RECEITA: 'bg-green-100 text-green-700 border-green-200',
  DESPESA: 'bg-red-100 text-red-700 border-red-200',
}

const emptyForm = {
  name: '', type: 'DESPESA' as 'RECEITA' | 'DESPESA',
  color: '#6366f1', parentId: '', description: '', isActive: true,
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'ALL' | 'RECEITA' | 'DESPESA'>('ALL')

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/categories?hierarchical=true')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(data)
    } catch {
      setError('Não foi possível carregar as categorias.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const parents = categories.filter(c => !c.parentId)
  const filtered = filterType === 'ALL' ? parents : parents.filter(c => c.type === filterType)

  const openCreate = (parentId?: string) => {
    setEditId(null)
    setForm({ ...emptyForm, parentId: parentId || '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (cat: Category) => {
    setEditId(cat.id)
    setForm({
      name: cat.name, type: cat.type,
      color: cat.color || '#6366f1',
      parentId: cat.parentId || '',
      description: cat.description || '',
      isActive: cat.isActive,
    })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const url = editId ? `/api/categories/${editId}` : '/api/categories'
      const method = editId ? 'PUT' : 'POST'
      const body = { ...form, parentId: form.parentId || undefined }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar categoria')
      }
      setShowForm(false)
      fetchCategories()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir categoria')
        return
      }
      setDeleteConfirm(null)
      fetchCategories()
    } catch { }
  }

  const renderCategory = (cat: Category, level = 0) => (
    <div key={cat.id}>
      <div className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 rounded-lg transition ${level > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {level > 0 && <ChevronRight className="h-3 w-3 text-gray-300 flex-shrink-0" />}
          <div
            className="h-4 w-4 rounded-full flex-shrink-0 border-2"
            style={{ backgroundColor: cat.color || '#6366f1', borderColor: cat.color || '#6366f1' }}
          />
          <span className="text-sm font-medium text-gray-900 truncate">{cat.name}</span>
          {cat.description && <span className="text-xs text-gray-400 truncate hidden sm:block">— {cat.description}</span>}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[cat.type]}`}>
            {cat.type === 'RECEITA' ? 'Receita' : 'Despesa'}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => openCreate(cat.id)} title="Nova subcategoria" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => openEdit(cat)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setDeleteConfirm(cat.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {cat.children?.map(child => renderCategory(child, level + 1))}
    </div>
  )

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
            <p className="text-sm text-gray-500 mt-1">Organize seus lançamentos por categoria</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchCategories} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus className="h-4 w-4" /> Nova Categoria
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          {(['ALL', 'RECEITA', 'DESPESA'] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {t === 'ALL' ? 'Todas' : t === 'RECEITA' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
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
            <button onClick={fetchCategories} className="text-red-600 text-sm font-medium hover:underline">Tentar novamente</button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <Tag className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-gray-500 font-medium">Nenhuma categoria encontrada</h3>
            <p className="text-gray-400 text-sm mt-1">Crie categorias para organizar seus lançamentos</p>
            <button onClick={() => openCreate()} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Nova Categoria
            </button>
          </div>
        )}

        {/* Lista */}
        {!loading && !error && filtered.length > 0 && (
          <div className="bg-white rounded-xl border divide-y divide-gray-100">
            {filtered.map(cat => renderCategory(cat))}
          </div>
        )}
      </div>

      {/* Modal Formulário */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {editId ? 'Editar Categoria' : form.parentId ? 'Nova Subcategoria' : 'Nova Categoria'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text" required maxLength={100}
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ex: Alimentação, Salário..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as 'RECEITA' | 'DESPESA' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="DESPESA">Despesa</option>
                  <option value="RECEITA">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color" value={form.color}
                    onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="h-9 w-16 rounded cursor-pointer border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{form.color}</span>
                </div>
              </div>

              {!form.parentId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria pai (opcional)</label>
                  <select
                    value={form.parentId} onChange={e => setForm(p => ({ ...p, parentId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Nenhuma (categoria raiz)</option>
                    {categories.filter(c => !c.parentId && c.type === form.type && c.id !== editId).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text" maxLength={255}
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Descrição opcional"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
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
            <h2 className="text-lg font-bold text-gray-900">Excluir categoria?</h2>
            <p className="text-sm text-gray-500">Categorias com lançamentos ou subcategorias não podem ser excluídas.</p>
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
