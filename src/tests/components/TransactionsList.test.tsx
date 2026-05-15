/**
 * CAMADA: Test
 * MÓDULO: TransactionsList - UX Fase 4
 * RESPONSABILIDADE: Testes BDD de agrupamento visual (atrasados/dia/futuros)
 * NÃO DEVE: Testar lógica de negócio (já coberta em calculateTotals)
 * DEPENDE DE: React Testing Library, Jest
 * 
 * FASE 4 - UX: Separar lançamentos por contexto temporal
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TransactionsList } from '@/components/transactions/TransactionsList'
import type { Transaction } from '@/utils/calculateTotals'

// Mock das transações para testes
const createTransaction = (
  id: string,
  dueDate: string,
  description: string,
  status: Transaction['status'] = 'PENDENTE'
): Transaction => ({
  id,
  due_date: dueDate,
  description,
  amount: 100,
  type: 'DESPESA',
  status,
  account_id: 'acc-1'
})

describe('TransactionsList - Fase 4 (UX: Atrasados/Dia/Futuros)', () => {
  const selectedDateStr = '2026-04-25'

  describe('Cenário A – Apenas atrasados e nada em D', () => {
    it('deve renderizar seção "Atrasados" quando há lançamentos antes de D', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-01', 'Conta luz abril'),
        createTransaction('tx-2', '2026-04-10', 'Internet abril')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      // Deve mostrar seção de atrasados
      expect(screen.getByText(/Atrasados até/i)).toBeInTheDocument()
      expect(screen.getByText('25/04/2026')).toBeInTheDocument()

      // Deve listar as transações atrasadas
      expect(screen.getByText('Conta luz abril')).toBeInTheDocument()
      expect(screen.getByText('Internet abril')).toBeInTheDocument()

      // Não deve ter seção do dia atual (ou deve estar vazia)
      const currentDaySection = screen.queryByText(/Lançamentos do dia/i)
      expect(currentDaySection).not.toBeInTheDocument()
    })

    it('deve mostrar mensagem quando não há lançamentos no dia selecionado', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-01', 'Conta luz abril')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      expect(screen.getByText(/Sem lançamentos para 25\/04\/2026/i)).toBeInTheDocument()
    })
  })

  describe('Cenário B – Atrasados + lançamentos no dia D', () => {
    it('deve separar atrasados e lançamentos do dia em seções distintas', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-01', 'Conta luz abril', 'PENDENTE'),
        createTransaction('tx-2', '2026-04-10', 'Internet abril', 'PENDENTE'),
        createTransaction('tx-3', '2026-04-25', 'Almoço cliente', 'CONFIRMADO'),
        createTransaction('tx-4', '2026-04-25', 'Uber', 'CONFIRMADO')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      // Seção de atrasados
      expect(screen.getByText(/Atrasados até 25\/04\/2026/i)).toBeInTheDocument()
      expect(screen.getByText('Conta luz abril')).toBeInTheDocument()
      expect(screen.getByText('Internet abril')).toBeInTheDocument()

      // Seção do dia atual (a data aparece tanto no header quanto nos itens inline)
      expect(screen.getAllByText(/25\/04\/2026/i).length).toBeGreaterThan(0)
      expect(screen.getByText('Almoço cliente')).toBeInTheDocument()
      expect(screen.getByText('Uber')).toBeInTheDocument()
    })

    it('deve mostrar atrasados primeiro, depois o dia', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-25', 'Lançamento do dia'),
        createTransaction('tx-2', '2026-04-01', 'Lançamento atrasado')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      // Verificar ordem: atrasados vem antes do dia
      const sections = screen.getAllByRole('heading', { level: 3 })
      expect(sections[0]).toHaveTextContent(/Atrasados/i)
    })
  })

  describe('Cenário C – Lançamentos futuros após D', () => {
    it('deve mostrar seção "Futuros" quando há lançamentos após D', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-01', 'Conta luz'),
        createTransaction('tx-2', '2026-04-25', 'Lançamento do dia'),
        createTransaction('tx-3', '2026-04-30', 'Salário maio', 'AGENDADO')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      // Deve ter seção de futuros
      expect(screen.getByText(/Futuros após 25\/04\/2026/i)).toBeInTheDocument()
      expect(screen.getByText('Salário maio')).toBeInTheDocument()
    })

    it('deve agrupar futuros por data', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-30', 'Salário maio'),
        createTransaction('tx-2', '2026-05-05', 'Conta luz maio')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      expect(screen.getByText(/30\/04\/2026/)).toBeInTheDocument()
      expect(screen.getByText(/05\/05\/2026/)).toBeInTheDocument()
    })
  })

  describe('Cenário D – Sem transações', () => {
    it('deve mostrar mensagem clara quando não há lançamentos', () => {
      render(
        <TransactionsList
          transactions={[]}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      expect(screen.getByText(/Nenhum lançamento/i)).toBeInTheDocument()
    })

    it('deve mostrar instrução para adicionar lançamento', () => {
      render(
        <TransactionsList
          transactions={[]}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      expect(screen.getByText(/Clique em "Novo" para adicionar/i)).toBeInTheDocument()
    })
  })

  describe('UX – Labels de data claros', () => {
    it('deve formatar datas no padrão brasileiro DD/MM/YYYY', () => {
      const transactions: Transaction[] = [
        createTransaction('tx-1', '2026-04-01', 'Conta')
      ]

      render(
        <TransactionsList
          transactions={transactions}
          selectedDateStr={selectedDateStr}
          onEdit={() => { }}
          onDelete={() => { }}
        />
      )

      expect(screen.getByText(/01\/04\/2026/)).toBeInTheDocument()
    })
  })
})
