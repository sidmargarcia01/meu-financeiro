/**
 * CAMADA: Test - Service
 * MÓDULO: Alerts
 * RESPONSABILIDADE: Testar regras de alertas de vencimento
 * NÃO DEVE: Testar componentes React ou API routes
 */

import { alertService } from '@/services/alertService'
import { transactionRepository } from '@/repositories/transactionRepository'

jest.mock('@/repositories/transactionRepository')

const ontem = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const hoje = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const amanha = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const mockTransaction = (overrides: Partial<{ dueDate: Date; status: string; type: string }> = {}) => ({
  id: 'tx-1',
  userId: 'user-id',
  description: 'Aluguel',
  amount: 1500,
  type: 'DESPESA',
  status: 'PENDENTE',
  dueDate: ontem(),
  regime: 'CAIXA',
  isRecurring: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

describe('alertService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getAlerts', () => {
    it('deve retornar alertas de lançamentos vencidos', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([
        mockTransaction({ dueDate: ontem() }),
      ])

      const result = await alertService.getAlerts('user-id')

      expect(result.vencidos).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('deve retornar alertas de lançamentos vencendo hoje', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([
        mockTransaction({ dueDate: hoje() }),
      ])

      const result = await alertService.getAlerts('user-id')

      expect(result.vence_hoje).toHaveLength(1)
    })

    it('deve retornar alertas de lançamentos vencendo amanha', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([
        mockTransaction({ dueDate: amanha() }),
      ])

      const result = await alertService.getAlerts('user-id')

      expect(result.vence_amanha).toHaveLength(1)
    })

    it('deve retornar zero alertas quando nao ha pendencias', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([])

      const result = await alertService.getAlerts('user-id')

      expect(result.total).toBe(0)
      expect(result.vencidos).toHaveLength(0)
      expect(result.vence_hoje).toHaveLength(0)
    })

    it('deve ignorar lancamentos ja confirmados ou conciliados', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([])

      await alertService.getAlerts('user-id')

      expect(transactionRepository.findUpcoming).toHaveBeenCalledWith(
        'user-id',
        expect.objectContaining({ status: 'PENDENTE' })
      )
    })

    it('nao deve retornar alertas de outro usuario', async () => {
      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([])

      await alertService.getAlerts('user-correto')

      expect(transactionRepository.findUpcoming).toHaveBeenCalledWith(
        'user-correto',
        expect.anything()
      )
      expect(transactionRepository.findUpcoming).not.toHaveBeenCalledWith(
        'outro-user',
        expect.anything()
      )
    })

    it('deve calcular days_overdue corretamente', async () => {
      const doisDiasAtras = new Date()
      doisDiasAtras.setDate(doisDiasAtras.getDate() - 2)
      doisDiasAtras.setHours(0, 0, 0, 0)

      ;(transactionRepository.findUpcoming as jest.Mock).mockResolvedValue([
        mockTransaction({ dueDate: doisDiasAtras }),
      ])

      const result = await alertService.getAlerts('user-id')

      expect(result.vencidos[0].days_overdue).toBe(2)
    })
  })
})
