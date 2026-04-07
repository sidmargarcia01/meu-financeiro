/**
 * CAMADA: Test - Service
 * MÓDULO: Search
 * RESPONSABILIDADE: Testar busca global de lançamentos
 * NÃO DEVE: Testar componentes React
 */

import { searchService } from '@/services/searchService'
import { transactionRepository } from '@/repositories/transactionRepository'

jest.mock('@/repositories/transactionRepository')

describe('searchService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deve buscar lançamentos por descrição', async () => {
    ;(transactionRepository.search as jest.Mock).mockResolvedValue([
      { id: 'tx-1', description: 'Mercado Extra', amount: 250,
        type: 'DESPESA', status: 'CONFIRMADO' }
    ])

    const result = await searchService.search('user-id', 'Mercado')
    expect(result.transactions).toHaveLength(1)
  })

  it('deve rejeitar busca com menos de 2 caracteres', async () => {
    await expect(
      searchService.search('user-id', 'a')
    ).rejects.toThrow('Termo de busca deve ter pelo menos 2 caracteres')
  })

  it('deve rejeitar busca com string vazia', async () => {
    await expect(
      searchService.search('user-id', '')
    ).rejects.toThrow('Termo de busca deve ter pelo menos 2 caracteres')
  })

  it('deve limitar a 20 resultados por padrão', async () => {
    const muitos = Array.from({ length: 30 }, (_, i) => ({
      id: `tx-${i}`, description: `Item ${i}`, amount: 100,
      type: 'DESPESA', status: 'CONFIRMADO'
    }))
    ;(transactionRepository.search as jest.Mock).mockResolvedValue(muitos)

    const result = await searchService.search('user-id', 'Item')
    expect(result.transactions.length).toBeLessThanOrEqual(20)
  })

  it('não deve retornar resultados de outro usuário', async () => {
    ;(transactionRepository.search as jest.Mock).mockResolvedValue([])
    await searchService.search('user-correto', 'Mercado')
    expect(transactionRepository.search).toHaveBeenCalledWith('user-correto', expect.anything())
  })

  it('deve retornar termo e total na resposta', async () => {
    ;(transactionRepository.search as jest.Mock).mockResolvedValue([
      { id: 'tx-1', description: 'Aluguel', amount: 1500, type: 'DESPESA', status: 'PENDENTE' }
    ])

    const result = await searchService.search('user-id', 'Aluguel')
    expect(result.term).toBe('Aluguel')
    expect(result.total).toBeGreaterThan(0)
  })

  it('deve remover espaços do termo antes de buscar', async () => {
    ;(transactionRepository.search as jest.Mock).mockResolvedValue([])
    await searchService.search('user-id', '  Mercado  ')
    expect(transactionRepository.search).toHaveBeenCalledWith(
      'user-id',
      expect.objectContaining({ term: 'Mercado' })
    )
  })
})
