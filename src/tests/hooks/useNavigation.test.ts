/**
 * CAMADA: Test - Hook
 * MÓDULO: Navigation
 * RESPONSABILIDADE: Testar estado de navegação da sidebar
 * NÃO DEVE: Testar componentes visuais
 */

import { renderHook, act } from '@testing-library/react'
import { useNavigation } from '@/hooks/useNavigation'

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard'),
}))

describe('useNavigation', () => {
  it('deve iniciar com a rota atual como ativa', () => {
    const { result } = renderHook(() => useNavigation())
    expect(result.current.activeRoute).toBeDefined()
    expect(result.current.activeRoute).toBe('/dashboard')
  })

  it('deve colapsar e expandir grupos da sidebar', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.toggleGroup('cadastros')
    })

    expect(result.current.collapsedGroups).toContain('cadastros')

    act(() => {
      result.current.toggleGroup('cadastros')
    })

    expect(result.current.collapsedGroups).not.toContain('cadastros')
  })

  it('deve expandir grupo automaticamente quando rota filha esta ativa', () => {
    const { result } = renderHook(() =>
      useNavigation('/cadastros/categorias')
    )
    expect(result.current.collapsedGroups).not.toContain('cadastros')
  })

  it('deve colapsar todos os grupos quando sidebar for minimizada', () => {
    const { result } = renderHook(() => useNavigation())

    act(() => {
      result.current.setSidebarMinimized(true)
    })

    expect(result.current.isSidebarMinimized).toBe(true)
  })

  it('deve retornar isRouteActive true para rota exata /dashboard', () => {
    const { result } = renderHook(() => useNavigation('/dashboard'))
    expect(result.current.isRouteActive('/dashboard')).toBe(true)
  })

  it('deve retornar isRouteActive false para rota diferente', () => {
    const { result } = renderHook(() => useNavigation('/dashboard'))
    expect(result.current.isRouteActive('/metas')).toBe(false)
  })

})
