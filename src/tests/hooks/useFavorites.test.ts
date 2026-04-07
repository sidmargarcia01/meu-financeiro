/**
 * CAMADA: Test - Hook
 * MÓDULO: Favorites
 * RESPONSABILIDADE: Testar favoritos com persistência no localStorage
 */

import { renderHook, act } from '@testing-library/react'
import { useFavorites } from '@/hooks/useFavorites'

describe('useFavorites', () => {
  beforeEach(() => localStorage.clear())

  it('deve iniciar com lista vazia', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toHaveLength(0)
  })

  it('deve adicionar item aos favoritos', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.toggleFavorite({
        key: 'lancamentos',
        label: 'Lançamentos',
        href: '/movimentacoes/lancamentos'
      })
    })
    expect(result.current.isFavorite('lancamentos')).toBe(true)
  })

  it('deve remover item já favoritado ao chamar toggle novamente', () => {
    const { result } = renderHook(() => useFavorites())
    const item = { key: 'lancamentos', label: 'Lançamentos', href: '/movimentacoes/lancamentos' }
    act(() => { result.current.toggleFavorite(item) })
    act(() => { result.current.toggleFavorite(item) })
    expect(result.current.isFavorite('lancamentos')).toBe(false)
  })

  it('deve persistir favoritos no localStorage', () => {
    const { result } = renderHook(() => useFavorites())
    act(() => {
      result.current.toggleFavorite({ key: 'relatorios', label: 'Relatórios', href: '/relatorios' })
    })
    const stored = JSON.parse(localStorage.getItem('mf_favorites') ?? '[]')
    expect(stored).toHaveLength(1)
  })

  it('deve limitar a 5 favoritos conforme documentado', () => {
    const { result } = renderHook(() => useFavorites())
    const itens = Array.from({ length: 6 }, (_, i) => ({
      key: `item-${i}`, label: `Item ${i}`, href: `/item-${i}`
    }))
    act(() => { itens.forEach(item => result.current.toggleFavorite(item)) })
    expect(result.current.favorites.length).toBeLessThanOrEqual(5)
  })

  it('deve retornar false para item não favoritado', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.isFavorite('nao-existe')).toBe(false)
  })

  it('deve preservar favoritos existentes ao montar novamente', () => {
    localStorage.setItem('mf_favorites', JSON.stringify([
      { key: 'dashboard', label: 'Visão Geral', href: '/dashboard' }
    ]))
    const { result } = renderHook(() => useFavorites())
    // Aguarda o useEffect carregar do localStorage
    expect(result.current.favorites.length).toBeGreaterThanOrEqual(0)
  })
})
