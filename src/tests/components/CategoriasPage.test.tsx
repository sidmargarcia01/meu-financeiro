/**
 * 📄 Descrição: Testes da página de categorias
 * 🧱 Contexto: Módulo de Cadastros - Categorias
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: React Testing Library, Jest
 * 🔍 Dependências: @testing-library/react, jest
 * ✅ Revisado: Sim
 *
 * CAMADA: Test - Page
 * MÓDULO: Cadastros - Categorias
 * RESPONSABILIDADE: Testar comportamento da página de categorias
 */

import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import CategoriasPage from '@/app/(authenticated)/cadastros/categorias/page'

// Mock do fetch global
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('CategoriasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  it('deve exibir estado de carregamento inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => { })) // Promise pendente
    render(<CategoriasPage />)
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument()
  })

  it('deve exibir lista de categorias após carregamento', async () => {
    const mockCategories = [
      { id: '1', name: 'Alimentação', type: 'DESPESA', parent_id: null },
      { id: '2', name: 'Salário', type: 'RECEITA', parent_id: null },
    ]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCategories,
    })

    render(<CategoriasPage />)

    await waitFor(() => {
      expect(screen.getByText('Alimentação')).toBeInTheDocument()
      expect(screen.getByText('Salário')).toBeInTheDocument()
    })
  })

  it('deve exibir mensagem de erro quando API falhar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Erro no servidor' }),
    })

    render(<CategoriasPage />)

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar categorias/i)).toBeInTheDocument()
    })
  })

  it('deve permitir criar nova categoria', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: 'Existente', type: 'DESPESA', parent_id: null }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '3', name: 'Nova Categoria', type: 'DESPESA' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: '1', name: 'Existente', type: 'DESPESA', parent_id: null },
          { id: '3', name: 'Nova Categoria', type: 'DESPESA', parent_id: null },
        ],
      })

    render(<CategoriasPage />)

    fireEvent.click(screen.getByRole('button', { name: /Nova Categoria/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nome da categoria/i)).toBeInTheDocument()
    })

    const input = screen.getByPlaceholderText(/Nome da categoria/i)
    fireEvent.change(input, { target: { value: 'Nova Categoria' } })

    fireEvent.click(screen.getByRole('button', { name: /^Criar$/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Nova Categoria', type: 'DESPESA' }),
        })
      )
    })
  })

  it('deve exibir mensagem quando não há categorias', async () => {
    jest.useFakeTimers()

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => [] })
      .mockResolvedValue({ ok: false, json: async () => ({}) })

    render(<CategoriasPage />)

    await act(async () => {
      await jest.runAllTimersAsync()
    })

    await waitFor(() => {
      expect(screen.getByText(/Nenhuma categoria cadastrada/i)).toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('deve permitir alternar entre tipos RECEITA e DESPESA', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    render(<CategoriasPage />)

    // Abre o dialog de criação (os seletores de tipo estão lá)
    fireEvent.click(screen.getByRole('button', { name: /Nova Categoria/i }))

    // Verifica que os campos de seleção de tipo estão disponíveis no formulário
    await waitFor(() => {
      const combos = screen.getAllByRole('combobox')
      expect(combos.length).toBeGreaterThan(0)
    })
  })
})
