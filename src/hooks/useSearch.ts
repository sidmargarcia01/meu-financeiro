/**
 * 📄 Descrição: Gerenciar estado da busca global com atalho CTRL+K
 * 🧱 Contexto: Utilizado pelo SearchModal e Header
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, React Query
 * 🔍 Dependências: @tanstack/react-query
 * ✅ Revisado: Sim
 *
 * CAMADA: Hook
 * MÓDULO: Search
 * RESPONSABILIDADE: Gerenciar estado da busca global com atalho CTRL+K
 * NÃO DEVE: Conter lógica de negócio, acessar banco
 * DEPENDE DE: React Query, /api/search
 */

'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

export function useSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [term, setTerm] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        setTerm('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['search', term],
    queryFn: async () => {
      if (term.length < 2) return { transactions: [] }
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`)
      if (!res.ok) return { transactions: [] }
      return res.json()
    },
    enabled: term.length >= 2,
    staleTime: 10_000,
  })

  return {
    isOpen,
    setIsOpen,
    term,
    setTerm,
    results: data?.transactions ?? [],
    isLoading,
  }
}
