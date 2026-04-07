/**
 * 📄 Descrição: Gerenciar itens favoritos da sidebar com persistência local
 * 🧱 Contexto: Utilizado pelo SidebarItem e SidebarFavorites
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, localStorage
 * 🔍 Dependências: nenhuma externa
 * ✅ Revisado: Sim
 *
 * CAMADA: Hook
 * MÓDULO: Favorites
 * RESPONSABILIDADE: Gerenciar itens favoritos da sidebar com persistência local
 * NÃO DEVE: Acessar APIs externas, conter lógica de negócio financeiro
 * DEPENDE DE: localStorage
 */

'use client'

import { useState, useEffect } from 'react'

export interface FavoriteItem {
  key: string
  label: string
  href: string
}

const STORAGE_KEY = 'mf_favorites'
const MAX_FAVORITES = 5

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setFavorites(JSON.parse(stored))
    } catch {
      /* ignora erros de parse */
    }
  }, [])

  const persist = (items: FavoriteItem[]) => {
    setFavorites(items)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  const toggleFavorite = (item: FavoriteItem) => {
    const exists = favorites.find(f => f.key === item.key)
    if (exists) {
      persist(favorites.filter(f => f.key !== item.key))
    } else if (favorites.length < MAX_FAVORITES) {
      persist([...favorites, item])
    }
  }

  const isFavorite = (key: string) => favorites.some(f => f.key === key)

  return { favorites, toggleFavorite, isFavorite }
}
