/**
 * CAMADA: Test - Repository
 * MÓDULO: Transaction
 * RESPONSABILIDADE: Testar métodos de acesso ao banco de dados
 * NÃO DEVE: Testar regras de negócio
 * DEPENDE DE: transactionRepository, mocks do Supabase
 */

import { transactionRepository } from '@/repositories/transactionRepository'
import { supabase } from '@/lib/supabase'

jest.mock('@/lib/supabase')

const mockSupabase = supabase as jest.Mocked<typeof supabase>

describe('TransactionRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── MÉTODO: findUpcoming ───────────────────────────────────────────────────

  describe('findUpcoming', () => {
    it('deve buscar lançamentos próximos ao vencimento', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          description: 'Aluguel',
          amount: 1500.00,
          due_date: '2026-04-15',
          status: 'PENDENTE',
          type: 'DESPESA',
          user_id: 'user-123',
          account: { id: 'acc-1', name: 'Conta Corrente', type: 'CORRENTE' },
          category: { id: 'cat-1', name: 'Moradia', type: 'DESPESA' }
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTransactions, error: null })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await transactionRepository.findUpcoming('user-123', {
        status: 'PENDENTE',
        dateFrom: '2026-04-01',
        dateTo: '2026-04-30'
      })

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('Aluguel')
      expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
    })

    it('deve retornar array vazio quando não há lançamentos', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      const result = await transactionRepository.findUpcoming('user-123', {
        status: 'PENDENTE',
        dateFrom: '2026-04-01',
        dateTo: '2026-04-30'
      })

      expect(result).toHaveLength(0)
    })

    it('deve lançar erro quando ocorrer erro no banco', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)

      await expect(
        transactionRepository.findUpcoming('user-123', {
          status: 'PENDENTE',
          dateFrom: '2026-04-01',
          dateTo: '2026-04-30'
        })
      ).rejects.toThrow('Database error')
    })
  })

  // ─── MÉTODO: sumByCategory ─────────────────────────────────────────────────

  describe('sumByCategory', () => {
    it('deve somar lançamentos agrupados por categoria', async () => {
      const mockData = [
        {
          categories: { id: 'cat-1', name: 'Alimentação' },
          amount: 1200.00
        },
        {
          categories: { id: 'cat-2', name: 'Transporte' },
          amount: 800.00
        }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis()
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)
      mockSupabase.from().select().eq().eq().gte().lte().not = jest.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      })

      const result = await transactionRepository.sumByCategory('user-123', {
        type: 'DESPESA',
        mes: 4,
        ano: 2026
      })

      expect(result).toHaveLength(2)
      expect(result[0].category_name).toBe('Alimentação')
      expect(result[0].total).toBe(1200.00)
    })

    it('deve retornar array vazio quando não há lançamentos', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis()
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)
      mockSupabase.from().select().eq().eq().gte().lte().not = jest.fn().mockResolvedValue({ 
        data: [], 
        error: null 
      })

      const result = await transactionRepository.sumByCategory('user-123', {
        type: 'DESPESA',
        mes: 4,
        ano: 2026
      })

      expect(result).toHaveLength(0)
    })

    it('deve lançar erro quando ocorrer erro no banco', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis()
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)
      mockSupabase.from().select().eq().eq().gte().lte().not = jest.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      })

      await expect(
        transactionRepository.sumByCategory('user-123', {
          type: 'DESPESA',
          mes: 4,
          ano: 2026
        })
      ).rejects.toThrow('Database error')
    })
  })

  // ─── MÉTODO: getMonthlySummary (sobrecarga para mês específico) ─────────────────

  describe('getMonthlySummary (mês específico)', () => {
    it('deve retornar resumo do mês específico', async () => {
      const mockData = [
        { amount: 8500.00, type: 'RECEITA' },
        { amount: 3200.00, type: 'DESPESA' }
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)
      mockSupabase.from().select().eq().gte().lte = jest.fn().mockResolvedValue({ 
        data: mockData, 
        error: null 
      })

      const result = await transactionRepository.getMonthlySummary('user-123', 4, 2026)

      expect(result.receitas).toBe(8500.00)
      expect(result.despesas).toBe(3200.00)
      expect(result.mes).toBe(4)
      expect(result.ano).toBe(2026)
    })

    it('deve lançar erro quando ocorrer erro no banco', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis()
      }

      mockSupabase.from = jest.fn().mockReturnValue(mockQuery)
      mockSupabase.from().select().eq().gte().lte = jest.fn().mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      })

      await expect(
        transactionRepository.getMonthlySummary('user-123', 4, 2026)
      ).rejects.toThrow('Database error')
    })
  })
})
