/**
 * 📄 Descrição: Testes do serviço de conciliação bancária
 * 🧱 Contexto: Módulo 2 — reconciliationService
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Jest
 * 🔍 Dependências: transactionRepository, accountRepository (mocked)
 * ✅ Revisado: Sim
 *
 * CAMADA: Test - Service
 * MÓDULO: Reconciliation
 * RESPONSABILIDADE: Testar regras de conciliação bancária
 */

import { reconciliationService } from '@/services/reconciliationService'
import { transactionRepository } from '@/repositories/transactionRepository'
import { accountRepository } from '@/repositories/accountRepository'

jest.mock('@/repositories/transactionRepository')
jest.mock('@/repositories/accountRepository')

describe('reconciliationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve marcar lançamento como CONCILIADO', async () => {
    ;(transactionRepository.findById as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      status: 'CONFIRMADO',
      userId: 'user-id',
    })
    ;(transactionRepository.update as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      status: 'CONCILIADO',
    })

    const result = await reconciliationService.conciliate('tx-1', 'user-id')
    expect(result.status).toBe('CONCILIADO')
  })

  it('deve rejeitar conciliação de lançamento PENDENTE', async () => {
    ;(transactionRepository.findById as jest.Mock).mockResolvedValue({
      id: 'tx-1',
      status: 'PENDENTE',
      userId: 'user-id',
    })

    await expect(
      reconciliationService.conciliate('tx-1', 'user-id')
    ).rejects.toThrow('Apenas lançamentos CONFIRMADOS podem ser conciliados')
  })

  it('deve rejeitar conciliação de lançamento inexistente', async () => {
    ;(transactionRepository.findById as jest.Mock).mockResolvedValue(null)

    await expect(
      reconciliationService.conciliate('tx-999', 'user-id')
    ).rejects.toThrow('Lançamento não encontrado')
  })

  it('deve retornar extrato agrupado por conta com saldos calculados', async () => {
    ;(accountRepository.findById as jest.Mock).mockResolvedValue({
      id: 'acc-1',
      name: 'Bradesco',
      initial_balance: 1000,
    })
    ;(transactionRepository.list as jest.Mock).mockResolvedValue([
      { id: 'tx-1', account_id: 'acc-1', amount: 500, type: 'RECEITA', status: 'CONFIRMADO' },
      { id: 'tx-2', account_id: 'acc-1', amount: 200, type: 'DESPESA', status: 'PENDENTE' },
    ])

    const result = await reconciliationService.getExtrato('user-id', 'acc-1', {})
    expect(result.transactions).toHaveLength(2)
    expect(result.saldo_projetado).toBeDefined()
    expect(result.saldo_confirmado).toBeDefined()
  })

  it('deve calcular saldo_projetado incluindo pendentes', async () => {
    ;(accountRepository.findById as jest.Mock).mockResolvedValue({
      id: 'acc-1',
      name: 'Bradesco',
      initial_balance: 0,
    })
    ;(transactionRepository.list as jest.Mock).mockResolvedValue([
      { id: 'tx-1', amount: 1000, type: 'RECEITA', status: 'CONFIRMADO' },
      { id: 'tx-2', amount: 300,  type: 'DESPESA', status: 'PENDENTE' },
    ])

    const result = await reconciliationService.getExtrato('user-id', 'acc-1', {})
    expect(result.saldo_projetado).toBe(700)
    expect(result.saldo_confirmado).toBe(1000)
  })

  it('deve rejeitar extrato de conta não encontrada', async () => {
    ;(accountRepository.findById as jest.Mock).mockResolvedValue(null)

    await expect(
      reconciliationService.getExtrato('user-id', 'acc-999', {})
    ).rejects.toThrow('Conta não encontrada')
  })
})
