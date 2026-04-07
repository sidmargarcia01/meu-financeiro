/**
 * CAMADA: Hook
 * MODULO: Navigation
 * RESPONSABILIDADE: Gerenciar estado da navegacao sidebar (ativa, colapsada, minimizada)
 * NAO DEVE: Conter logica de negocio, fazer fetch de dados, acessar APIs
 * DEPENDE DE: React, next/navigation
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const GROUPS_WITH_CHILDREN: Record<string, string[]> = {
  movimentacoes: ['/movimentacoes', '/cartoes'],
  gestao: ['/gestao/dre', '/gestao/dfc', '/gestao/balanco'],
  cadastros: [
    '/cadastros/categorias',
    '/cadastros/centros',
    '/cadastros/contas',
    '/cadastros/formas-pagamento',
    '/cadastros/projetos',
    '/cadastros/tags',
  ],
  ferramentas: [
    '/ferramentas/documentos',
    '/ferramentas/propostas',
    '/ferramentas/regras',
    '/ferramentas/importacao',
    '/ferramentas/conexoes',
  ],
}

export function useNavigation(overridePath?: string) {
  const pathname = usePathname()
  const activePath = overridePath ?? pathname

  const getInitialCollapsed = (): string[] => {
    // Colapsa todos os grupos exceto o que contém a rota ativa (filho)
    // Em rotas de topo (/dashboard, /metas, etc.), todos os grupos começam expandidos
    const activeGroup = Object.keys(GROUPS_WITH_CHILDREN).find(group =>
      GROUPS_WITH_CHILDREN[group].some(route => activePath.startsWith(route))
    )
    if (!activeGroup) return []
    return Object.keys(GROUPS_WITH_CHILDREN).filter(g => g !== activeGroup)
  }

  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(
    getInitialCollapsed
  )
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false)

  useEffect(() => {
    setCollapsedGroups(getInitialCollapsed())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePath])

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev =>
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    )
  }

  const setSidebarMinimized = (minimized: boolean) => {
    setIsSidebarMinimized(minimized)
    if (minimized) {
      setCollapsedGroups(Object.keys(GROUPS_WITH_CHILDREN))
    }
  }

  const isGroupCollapsed = (group: string): boolean =>
    collapsedGroups.includes(group)

  const isRouteActive = (route: string): boolean => {
    if (route === '/dashboard') return activePath === '/dashboard'
    return activePath.startsWith(route)
  }

  return {
    activeRoute: activePath,
    collapsedGroups,
    isSidebarMinimized,
    toggleGroup,
    setSidebarMinimized,
    isGroupCollapsed,
    isRouteActive,
  }
}
