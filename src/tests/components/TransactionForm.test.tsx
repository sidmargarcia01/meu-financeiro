/**
 * 📄 Descrição: Testes do formulário de lançamento
 * 🧱 Contexto: Módulo 1 — TransactionForm component tests
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React Testing Library, Jest
 * 🔍 Dependências: @testing-library/react, jest
 * ✅ Revisado: Sim
 *
 * CAMADA: Test - Component
 * MÓDULO: Transactions - Form
 * RESPONSABILIDADE: Testar comportamento do formulário de lançamento
 * NÃO DEVE: Testar regras de negócio (estão no transactionService)
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { TransactionForm } from '@/components/transactions/TransactionForm'

const mockProps = {
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  accounts: [{ id: 'acc-1', name: 'Bradesco', type: 'CORRENTE' }],
  categories: [{ id: 'cat-1', name: 'Alimentação', type: 'DESPESA', children: [] }],
  settings: {
    enable_competence_date: false,
    require_cost_center: false,
    require_project: false,
    require_contact: false,
    require_tag: false,
    require_subcategory: false,
    installment_default: 'VALOR_PARCELA' as const,
  },
}

describe('TransactionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar campos obrigatórios: Valor, Data, Categoria, Conta', () => {
    render(<TransactionForm {...mockProps} />)
    expect(screen.getByLabelText(/valor/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/data/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/categoria/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/conta/i)).toBeInTheDocument()
  })

  it('deve ocultar campo Data de Competência quando enable_competence_date for false', () => {
    render(<TransactionForm {...mockProps} />)
    expect(screen.queryByLabelText(/data de competência/i)).not.toBeInTheDocument()
  })

  it('deve exibir campo Data de Competência quando enable_competence_date for true', () => {
    render(
      <TransactionForm
        {...mockProps}
        settings={{ ...mockProps.settings, enable_competence_date: true }}
      />
    )
    expect(screen.getByLabelText(/data de competência/i)).toBeInTheDocument()
  })

  it('deve exibir opções de repetição: Fixo e Parcelado', () => {
    render(<TransactionForm {...mockProps} />)
    const repeticao = screen.getByLabelText(/repetição/i)
    fireEvent.mouseDown(repeticao)
    expect(screen.getByText(/fixo/i)).toBeInTheDocument()
    expect(screen.getByText(/parcelado/i)).toBeInTheDocument()
  })

  it('deve exibir campo N parcelas quando tipo for Parcelado', async () => {
    render(
      <TransactionForm
        {...mockProps}
        settings={{ ...mockProps.settings, installment_default: 'NUMERO_PARCELAS' }}
      />
    )
    const repeticao = screen.getByLabelText(/repetição/i)
    fireEvent.mouseDown(repeticao)
    fireEvent.click(screen.getByText(/parcelado/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/n.*parcelas/i)).toBeInTheDocument()
    })
  })

  it('deve exibir campo calculado (read-only) de Valor por Parcela ao selecionar Parcelado', async () => {
    render(<TransactionForm {...mockProps} />)
    const repeticao = screen.getByLabelText(/repetição/i)
    fireEvent.mouseDown(repeticao)
    fireEvent.click(screen.getByText(/parcelado/i))
    await waitFor(() => {
      expect(screen.getByLabelText(/valor por parcela/i)).toBeInTheDocument()
    })
  })

  it('deve tornar Centro de Custo obrigatório quando require_cost_center for true', async () => {
    render(
      <TransactionForm
        {...mockProps}
        settings={{ ...mockProps.settings, require_cost_center: true }}
        costCenters={[{ id: 'cc-1', name: 'Administrativo' }]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }))
    await waitFor(() => {
      expect(screen.getByText(/centro de custo é obrigatório/i)).toBeInTheDocument()
    })
  })

  it('deve bloquear submit sem campos obrigatórios preenchidos', async () => {
    const { container } = render(<TransactionForm {...mockProps} />)
    const form = container.querySelector('form') as HTMLFormElement
    await act(async () => { form?.requestSubmit() })
    await waitFor(() => {
      expect(mockProps.onSubmit).not.toHaveBeenCalled()
    })
  })

  it('deve chamar onSubmit com dados corretos quando válido', async () => {
    // Pré-preenche todos os campos via initialData para evitar interação MUI Select/Portal em jsdom
    const { container } = render(
      <TransactionForm
        {...mockProps}
        initialData={{
          type: 'DESPESA',
          amount: 150,
          description: 'Supermercado',
          due_date: '2026-04-07',
          account_id: 'acc-1',
          category_id: 'cat-1',
          status: 'PENDENTE',
          regime: 'CAIXA',
          repetition_type: 'NONE',
          tags: [],
        }}
      />
    )
    const form = container.querySelector('form') as HTMLFormElement
    // flushPromises drena microtasks do zodResolver.parseAsync antes de act finalizar
    const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
    await act(async () => {
      form?.requestSubmit()
      await flushPromises()
    })
    expect(mockProps.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 150, description: 'Supermercado' })
    )
  })
})
