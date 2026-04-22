'use client'

import { useState, useEffect } from 'react'

interface Category {
    id: string
    name: string
    type: 'RECEITA' | 'DESPESA'
    parent_id: string | null
    children?: Category[]
}

export default function CategoriasPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [newCategory, setNewCategory] = useState({ name: '', type: 'DESPESA' as 'RECEITA' | 'DESPESA' })

    useEffect(() => {
        fetchCategories()
    }, [])

    const fetchCategories = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/categories')
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
                throw new Error(errData.error || `Erro ${res.status}`)
            }
            const data = await res.json()
            setCategories(data)
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar categorias')
            console.error('Erro:', err)
        } finally {
            setLoading(false)
        }
    }

    const createCategory = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCategory.name.trim()) return

        try {
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory)
            })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Erro ao criar' }))
                throw new Error(errData.error)
            }
            setNewCategory({ name: '', type: 'DESPESA' })
            fetchCategories()
        } catch (err: any) {
            alert('Erro: ' + err.message)
        }
    }

    const deleteCategory = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir?')) return
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Erro ao excluir')
            fetchCategories()
        } catch (err: any) {
            alert('Erro: ' + err.message)
        }
    }

    if (loading) return <div style={{ padding: 40 }}>Carregando...</div>
    if (error) return (
        <div style={{ padding: 40 }}>
            <h2 style={{ color: 'red' }}>Erro ao carregar categorias</h2>
            <p>{error}</p>
            <button onClick={fetchCategories}>Tentar novamente</button>
        </div>
    )

    return (
        <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
            <h1>Categorias</h1>

            <form onSubmit={createCategory} style={{ marginBottom: 30, padding: 20, border: '1px solid #ddd', borderRadius: 8 }}>
                <h3>Nova Categoria</h3>
                <input
                    type="text"
                    placeholder="Nome da categoria"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    style={{ padding: 8, marginRight: 10, width: 200 }}
                />
                <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({ ...newCategory, type: e.target.value as 'RECEITA' | 'DESPESA' })}
                    style={{ padding: 8, marginRight: 10 }}
                >
                    <option value="DESPESA">Despesa</option>
                    <option value="RECEITA">Receita</option>
                </select>
                <button type="submit" style={{ padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4 }}>
                    Criar
                </button>
            </form>

            <h3>Lista de Categorias ({categories.length})</h3>
            {categories.length === 0 ? (
                <p>Nenhuma categoria cadastrada.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {categories.map((cat) => (
                        <li key={cat.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>
                                <strong>{cat.name}</strong>
                                <span style={{
                                    marginLeft: 10,
                                    padding: '2px 8px',
                                    borderRadius: 4,
                                    fontSize: 12,
                                    background: cat.type === 'RECEITA' ? '#e8f5e9' : '#ffebee',
                                    color: cat.type === 'RECEITA' ? '#2e7d32' : '#c62828'
                                }}>
                                    {cat.type}
                                </span>
                            </span>
                            <button
                                onClick={() => deleteCategory(cat.id)}
                                style={{ padding: '4px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: 4 }}
                            >
                                Excluir
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
