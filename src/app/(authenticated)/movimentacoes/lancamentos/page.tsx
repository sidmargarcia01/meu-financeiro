/**
 * 📄 Descrição: Página de lançamentos de caixa com layout profissional
 * 🧱 Contexto: Módulo 1 — rota /movimentacoes/lancamentos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-23
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: TransactionForm, formatCurrency, formatDate
 * ✅ Revisado: Sim
 *
 * Layout: Sidebar (contas) + Timeline (lançamentos) + Resumo
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { calculateTotals } from '@/utils/calculateTotals'
import {
  Box, Button, Typography, Drawer, IconButton, Chip, Paper,
  CircularProgress, Alert, Tooltip, Stack, Divider, Checkbox,
  FormControlLabel, ToggleButton, ToggleButtonGroup, Fab, TextField,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, FormControl, InputLabel, Select
} from '@mui/material'
import {
  Add as AddIcon,
  Close as CloseIcon,
  CheckCircle as ConfirmedIcon,
  RadioButtonUnchecked as PendingIcon,
  Schedule as ScheduledIcon,
  Verified as ConciliatedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  CalendarMonth as CalendarIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Settings as SettingsIcon,
  FileDownload as ExportIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  AccountBalance as AccountIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  SwapHoriz as SwapIcon,
  SwapHoriz,
  MoreVert as MoreIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  TrendingFlat as PartialIcon,
  ContentCopy as CopyIcon,
  Info as InfoIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { TransactionFormData } from '@/components/transactions/TransactionForm'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

// Configuração de status
const STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendentes',
    color: '#f59e0b' as const,
    bgColor: '#fef3c7',
    icon: <PendingIcon fontSize="small" />,
    textColor: '#92400e'
  },
  AGENDADO: {
    label: 'Agendados',
    color: '#3b82f6' as const,
    bgColor: '#dbeafe',
    icon: <ScheduledIcon fontSize="small" />,
    textColor: '#1e40af'
  },
  CONFIRMADO: {
    label: 'Confirmados',
    color: '#22c55e' as const,
    bgColor: '#dcfce7',
    icon: <ConfirmedIcon fontSize="small" />,
    textColor: '#166534'
  },
  CONCILIADO: {
    label: 'Conciliados',
    color: '#06b6d4' as const,
    bgColor: '#cffafe',
    icon: <ConciliatedIcon fontSize="small" />,
    textColor: '#0e7490'
  },
}

// Retorna a cor da bolinha de status da transação
// Pendente atrasado = vermelho, agendado = amarelo, confirmado = verde, conciliado = azul
const getStatusDotColor = (tx: { status: string; due_date: string }): string => {
  if (tx.status === 'CONCILIADO') return '#06b6d4'
  if (tx.status === 'CONFIRMADO') return '#22c55e'
  // PENDENTE: verifica se está atrasado
  const today = new Date().toISOString().split('T')[0]
  if (tx.due_date < today) return '#ef4444'  // atrasado
  return '#f59e0b'                           // agendado
}

// Retorna quantos dias de atraso (apenas para PENDENTE atrasado)
const getDaysOverdue = (tx: { status: string; due_date: string }): number | null => {
  if (tx.status !== 'PENDENTE') return null
  const today = new Date()
  const dueDate = new Date(tx.due_date + 'T12:00:00')
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

const DEFAULT_SETTINGS = {
  enable_competence_date: false,
  require_cost_center: false,
  require_project: false,
  require_contact: false,
  require_tag: false,
  require_subcategory: false,
  installment_default: 'VALOR_PARCELA' as const,
}

// Interfaces
interface Transaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO'
  due_date: string
  competence_date?: string
  account_id?: string
  category_id?: string
  account_name?: string
  category_name?: string
  destination_account_id?: string
  destination_account_name?: string
  document_number?: string
  notes?: string
  tags?: string[]
}

interface AccountWithBalance {
  id: string
  name: string
  type: string
  confirmedBalance: number
  projectedBalance: number
  initialBalance: number
}

interface Category { id: string; name: string; type?: string; children?: Category[] }

// Componente principal
export default function LancamentosCaixaPage() {
  // Estados
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['PENDENTE', 'AGENDADO', 'CONFIRMADO', 'CONCILIADO'])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<AccountWithBalance[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estado do menu de ações
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  // Estado do modal de conciliação
  const [conciliationOpen, setConciliationOpen] = useState(false)
  const [conciliationData, setConciliationData] = useState({
    amount: '',
    date: '',
    accountId: '',
    documentNumber: '',
    notes: '',
    tags: ''
  })

  // Buscar saldos das contas
  const fetchAccounts = useCallback(async () => {
    try {
      const accs = await fetch('/api/accounts?balances=true').then(r => r.json())
      setAccounts(Array.isArray(accs) ? accs : [])
    } catch { /* silencioso */ }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    Promise.all([
      fetch('/api/accounts?balances=true').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([accs, cats]) => {
      setAccounts(Array.isArray(accs) ? accs : [])
      setCategories(Array.isArray(cats) ? cats : [])
      setSelectedAccounts(accs.map((a: AccountWithBalance) => a.id))
    }).catch(() => setError('Erro ao carregar dados.'))
  }, [])

  // Buscar transações:
  // 1. PENDENTE: todas (para nao perder de vista)
  // 2. CONFIRMADO/CONCILIADO: apenas do dia selecionado
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const selectedDate = currentDate.toISOString().split('T')[0]

      // Fetch 1: CONFIRMADOS/CONCILIADOS apenas do dia selecionado
      const confirmedParams = new URLSearchParams()
      confirmedParams.set('limit', '500')
      confirmedParams.set('startDate', selectedDate)
      confirmedParams.set('endDate', selectedDate)
      if (searchTerm) confirmedParams.set('search', searchTerm)

      // Fetch 2: todos PENDENTEs (sempre visíveis)
      const pendingParams = new URLSearchParams()
      pendingParams.set('status', 'PENDENTE')
      pendingParams.set('limit', '500')
      if (searchTerm) pendingParams.set('search', searchTerm)

      const [res1, res2] = await Promise.all([
        fetch(`/api/transactions?${confirmedParams}`),
        fetch(`/api/transactions?${pendingParams}`)
      ])
      if (!res1.ok) throw new Error()

      const [data1, data2] = await Promise.all([res1.json(), res2.json()])
      const txs1: Transaction[] = Array.isArray(data1) ? data1 : (data1.data ?? [])
      const txs2: Transaction[] = Array.isArray(data2) ? data2 : (data2.data ?? [])

      const seen = new Set(txs1.map(t => t.id))
      setTransactions([...txs1, ...txs2.filter(t => !seen.has(t.id))])
    } catch {
      setError('Erro ao carregar lançamentos.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, currentDate])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const statusMatch = selectedStatuses.includes(tx.status)
      const accountMatch = selectedAccounts.includes(tx.account_id || '')
      return statusMatch && accountMatch
    })
  }, [transactions, selectedStatuses, selectedAccounts])

  // Separar transações do dia vs acumuladas
  const selectedDateStr = currentDate.toISOString().split('T')[0]
  const currentDayTransactions = useMemo(() => {
    return filteredTransactions.filter(tx => tx.due_date === selectedDateStr)
  }, [filteredTransactions, selectedDateStr])

  // Agrupar por data usando a data selecionada no calendario como referencia
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    filteredTransactions.forEach(tx => {
      const date = tx.due_date
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => {
        if (a === selectedDateStr) return -1   // data selecionada sempre primeiro
        if (b === selectedDateStr) return 1
        return new Date(a).getTime() - new Date(b).getTime()  // passado: mais atrasado primeiro
      })
  }, [filteredTransactions, selectedDateStr])

  // Calcular totais (até a data selecionada D, inclusive)
  // FASE 1: Alterado de currentDayTransactions (=== D) para filteredTransactions (<= D)
  const totals = useMemo(() => {
    return calculateTotals(
      filteredTransactions,
      selectedDateStr,
      selectedAccounts,
      accounts.map(a => ({ id: a.id, initialBalance: a.initialBalance || 0 }))
    )
  }, [filteredTransactions, selectedDateStr, selectedAccounts, accounts])

  // Calcular saldos das contas baseado na data selecionada (ate o dia, inclusive)
  const accountBalances = useMemo(() => {
    const selectedDate = currentDate.toISOString().split('T')[0]
    const balances: { [accountId: string]: { confirmed: number; projected: number } } = {}

    accounts.forEach(acc => {
      const initial = acc.initialBalance || 0

      // Transacoes ate a data selecionada (inclusive)
      const txsUntilDate = transactions.filter(t =>
        t.due_date <= selectedDate &&
        t.account_id === acc.id
      )

      // Confirmado: apenas CONFIRMADO e CONCILIADO
      const confirmed = txsUntilDate
        .filter(t => ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
        .reduce((sum, t) => {
          if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
          if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
          return sum
        }, initial)

      // Projetado: todas as transacoes (PENDENTE tambem)
      const projected = txsUntilDate
        .reduce((sum, t) => {
          if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
          if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
          return sum
        }, initial)

      balances[acc.id] = { confirmed, projected }
    })

    return balances
  }, [transactions, accounts, currentDate])

  // Calcular saldo anterior (baseado na data selecionada)
  const saldoAnterior = useMemo(() => {
    const selectedDate = currentDate.toISOString().split('T')[0]
    const initialBalanceSum = accounts
      .filter(a => selectedAccounts.includes(a.id))
      .reduce((sum, a) => sum + (a.initialBalance || 0), 0)

    // Buscar todas as transações anteriores à data selecionada
    const pastTx = transactions.filter(t =>
      t.due_date < selectedDate &&
      selectedAccounts.includes(t.account_id || '') &&
      ['CONFIRMADO', 'CONCILIADO'].includes(t.status)
    )

    return pastTx.reduce((sum, t) => {
      if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
      if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
      return sum
    }, initialBalanceSum)
  }, [transactions, selectedAccounts, accounts, currentDate])

  // Handlers
  const toISODate = (d: string) => d ? new Date(d + 'T12:00:00.000Z').toISOString() : undefined

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const method = editTarget ? 'PUT' : 'POST'
      const url = editTarget ? `/api/transactions/${editTarget.id}` : '/api/transactions'
      const payload: Record<string, unknown> = {
        description: data.description,
        amount: data.amount,
        type: data.type,
        dueDate: toISODate(data.due_date),
        accountId: data.account_id || undefined,
        categoryId: data.category_id || undefined,
        status: data.status || 'PENDENTE',
        regime: data.regime || 'CAIXA',
        notes: data.notes || undefined,
        tags: data.tags || [],
        isRecurring: data.repetition_type !== 'NONE',
        // Para transferência: inclui conta destino como transferData
        ...(data.type === 'TRANSFERENCIA' && data.destination_account_id ? {
          transferData: { destinationAccountId: data.destination_account_id }
        } : {}),
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setFormOpen(false)
        setEditTarget(null)
        fetchTransactions()
        fetchAccounts()
      } else {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.error || `Erro ${res.status}`)
      }
    } catch {
      setSubmitError('Falha de conexão.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions()
    fetchAccounts()
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    )
  }

  const openNew = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (tx: Transaction) => { setEditTarget(tx); setFormOpen(true) }

  // Handlers do menu de ações
  const openMenu = (e: React.MouseEvent<HTMLElement>, tx: Transaction) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
    setSelectedTransaction(tx)
  }
  const closeMenu = () => { setMenuAnchor(null); setSelectedTransaction(null) }

  const handleConfirm = async () => {
    if (!selectedTransaction) return
    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMADO' })
    })
    fetchTransactions()
    fetchAccounts()
    closeMenu()
  }

  const handleConfirmToday = async () => {
    if (!selectedTransaction) return
    const today = new Date().toISOString().split('T')[0]
    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMADO', due_date: today })
    })
    fetchTransactions()
    fetchAccounts()
    closeMenu()
  }

  const handleConfirmPartial = async () => {
    // TODO: Implementar confirmação parcial com valor
    alert('Confirmação parcial - implementar modal com valor parcial')
    closeMenu()
  }

  const handleConciliar = async () => {
    if (!selectedTransaction) return
    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONCILIADO' })
    })
    fetchTransactions()
    fetchAccounts()
    closeMenu()
  }

  const handleClone = async () => {
    if (!selectedTransaction) return
    const { id, ...data } = selectedTransaction
    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        description: `${data.description} (cópia)`,
        status: 'PENDENTE'
      })
    })
    fetchTransactions()
    fetchAccounts()
    closeMenu()
  }

  const handleDetail = () => {
    if (selectedTransaction) {
      openEdit(selectedTransaction)
      closeMenu()
    }
  }

  const handleDeleteFromMenu = () => {
    if (selectedTransaction) {
      handleDelete(selectedTransaction.id)
      closeMenu()
    }
  }

  // Handler para abrir modal de conciliação
  const openConciliationModal = () => {
    if (!selectedTransaction) return

    // Formatar valor no padrão brasileiro (vírgula como decimal)
    const formattedAmount = selectedTransaction.amount
      ? Math.abs(selectedTransaction.amount).toFixed(2).replace('.', ',')
      : '0,00'

    // Usar competence_date se existir, senão due_date, senão hoje
    const dateToUse = selectedTransaction.competence_date
      || selectedTransaction.due_date
      || new Date().toISOString().split('T')[0]

    setConciliationData({
      amount: formattedAmount,
      date: dateToUse,
      accountId: selectedTransaction.account_id || '',
      documentNumber: selectedTransaction.document_number || '',
      notes: selectedTransaction.notes || '',
      tags: selectedTransaction.tags?.join(', ') || ''
    })
    setMenuAnchor(null)  // Fecha o menu sem limpar selectedTransaction
    setConciliationOpen(true)
  }

  const closeConciliationModal = () => {
    setConciliationOpen(false)
    setConciliationData({ amount: '', date: '', accountId: '', documentNumber: '', notes: '', tags: '' })
    setSelectedTransaction(null)  // Limpa a transação selecionada ao fechar
  }

  const handleSubmitConciliation = async () => {
    if (!selectedTransaction) return

    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONCILIADO',
        amount: parseFloat(conciliationData.amount.replace(/\./g, '').replace(',', '.')),  // converte formato BRL (1.234,56 → 1234.56)
        due_date: conciliationData.date,
        account_id: conciliationData.accountId,
        document_number: conciliationData.documentNumber,
        notes: conciliationData.notes,
        tags: conciliationData.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
    })

    fetchTransactions()
    fetchAccounts()
    closeConciliationModal()
  }

  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const currentDateStr = useMemo(() => {
    const d = currentDate
    return `${String(d.getDate()).padStart(2, '0')} ${monthNames[d.getMonth()]} ${d.getFullYear()}`
  }, [currentDate])

  const goToPrevDay = () => {
    setCurrentDate(prev => { const nd = new Date(prev); nd.setDate(nd.getDate() - 1); return nd })
  }
  const goToNextDay = () => {
    setCurrentDate(prev => { const nd = new Date(prev); nd.setDate(nd.getDate() + 1); return nd })
  }
  const goToToday = () => setCurrentDate(new Date())
  const dateInputRef = useRef<HTMLInputElement>(null)

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 1.5, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={goToPrevDay}>
            <PrevIcon fontSize="small" />
          </IconButton>
          <Typography
            variant="body1"
            sx={{ fontWeight: 500, fontSize: '0.95rem', cursor: 'pointer', minWidth: 90, textAlign: 'center' }}
            onClick={() => dateInputRef.current?.showPicker?.()}
          >
            {currentDateStr}
          </Typography>
          <IconButton size="small" onClick={goToNextDay}>
            <NextIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => dateInputRef.current?.showPicker?.()}>
            <CalendarIcon fontSize="small" />
          </IconButton>
          <input
            ref={dateInputRef}
            type="date"
            value={currentDate.toISOString().split('T')[0]}
            onChange={(e) => e.target.value && setCurrentDate(new Date(e.target.value))}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
        </Box>

        <Stack direction="row" spacing={1}>
          <IconButton size="small"><SearchIcon /></IconButton>
          <IconButton size="small"><SettingsIcon /></IconButton>
          <IconButton size="small"><ExportIcon /></IconButton>
          <IconButton size="small"><PrintIcon /></IconButton>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
          >
            Novo
          </Button>
        </Stack>
      </Paper>

      {/* Filtros de Status */}
      <Box sx={{ px: 2, py: 1, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>Filtrar:</Typography>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <Chip
              key={key}
              icon={cfg.icon}
              label={cfg.label}
              size="small"
              onClick={() => toggleStatus(key)}
              sx={{
                bgcolor: selectedStatuses.includes(key) ? cfg.bgColor : 'transparent',
                color: selectedStatuses.includes(key) ? cfg.textColor : '#6b7280',
                border: '1px solid',
                borderColor: selectedStatuses.includes(key) ? cfg.color : '#e5e7eb',
                fontWeight: 500,
                cursor: 'pointer',
                '&:hover': { bgcolor: cfg.bgColor }
              }}
            />
          ))}
        </Stack>
      </Box>

      {/* Conteúdo principal */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar - Contas */}
        <Paper sx={{ width: 320, borderRadius: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          {/* Header Contas com colunas */}
          <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: 36 }} /> {/* Espaço checkbox */}
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ flex: 1, fontSize: '0.75rem', letterSpacing: '0.5px' }}>CONTAS</Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ width: 85, textAlign: 'right', fontSize: '0.7rem', letterSpacing: '0.3px' }}>Confirmado</Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ width: 85, textAlign: 'right', fontSize: '0.7rem', ml: 1.5, letterSpacing: '0.3px' }}>Projetado</Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {accounts.map(acc => {
              const bal = accountBalances[acc.id] || { confirmed: 0, projected: 0 }
              return (
                <Box
                  key={acc.id}
                  sx={{
                    p: 1.25,
                    borderBottom: '1px solid #f3f4f6',
                    bgcolor: selectedAccounts.includes(acc.id) ? '#fafafa' : 'transparent',
                    '&:hover': { bgcolor: '#f9fafb' }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Checkbox
                      size="small"
                      checked={selectedAccounts.includes(acc.id)}
                      onChange={() => toggleAccount(acc.id)}
                      sx={{ p: 0.5 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                      <Typography variant="caption" fontWeight={600} noWrap display="block" sx={{ fontSize: '0.8rem', letterSpacing: '0.2px' }}>{acc.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', letterSpacing: '0.3px', textTransform: 'uppercase' }}>{acc.type}</Typography>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        width: 85,
                        textAlign: 'right',
                        fontSize: '0.78rem',
                        color: bal.confirmed >= 0 ? '#22c55e' : '#ef4444',
                        fontWeight: 500,
                        letterSpacing: '0.3px'
                      }}
                    >
                      {formatCurrency(bal.confirmed)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        width: 85,
                        textAlign: 'right',
                        fontSize: '0.78rem',
                        color: bal.projected >= 0 ? '#22c55e' : '#ef4444',
                        ml: 1.5,
                        fontWeight: 500,
                        letterSpacing: '0.3px'
                      }}
                    >
                      {formatCurrency(bal.projected)}
                    </Typography>
                  </Stack>
                </Box>
              )
            })}
          </Box>

          {/* Total */}
          <Box sx={{ p: 1.5, borderTop: '2px solid #e5e7eb', bgcolor: '#f9fafb' }}>
            <Stack direction="row" alignItems="center">
              <Box sx={{ width: 36 }} />
              <Typography variant="body2" fontWeight={700} sx={{ flex: 1, fontSize: '0.85rem' }}>Total</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ width: 85, textAlign: 'right', color: '#22c55e', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                {formatCurrency(accounts.filter(a => selectedAccounts.includes(a.id)).reduce((sum, a) => sum + (accountBalances[a.id]?.confirmed || 0), 0))}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ width: 85, textAlign: 'right', ml: 1.5, color: '#ef4444', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                {formatCurrency(accounts.filter(a => selectedAccounts.includes(a.id)).reduce((sum, a) => sum + (accountBalances[a.id]?.projected || 0), 0))}
              </Typography>
            </Stack>
          </Box>

          {/* Resumo - Resultados */}
          <Box sx={{ p: 1.5, borderTop: '1px solid #e5e7eb', bgcolor: '#f9fafb' }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center', fontSize: '0.7rem' }}>
              Resultados (R$)
            </Typography>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontSize="0.75rem">Entradas</Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#22c55e', fontSize: '0.75rem' }}>
                {formatCurrency(totals.entradas)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5, pl: 1 }}>
              <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Receitas</Typography>
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: '#22c55e' }}>
                {formatCurrency(totals.receitas)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1, pl: 1 }}>
              <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Transferências</Typography>
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: '#6b7280' }}>
                0,00
              </Typography>
            </Stack>

            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontSize="0.75rem">Saídas</Typography>
              <Typography variant="caption" fontWeight={600} sx={{ color: '#ef4444', fontSize: '0.75rem' }}>
                {formatCurrency(totals.saidas)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5, pl: 1 }}>
              <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Despesas</Typography>
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: '#ef4444' }}>
                {formatCurrency(totals.despesas)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1, pl: 1 }}>
              <Typography variant="caption" fontSize="0.7rem" color="text.secondary">Transferências</Typography>
              <Typography variant="caption" fontSize="0.7rem" sx={{ color: '#6b7280' }}>
                0,00
              </Typography>
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" fontWeight={600} fontSize="0.75rem">Resultado</Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: totals.resultado >= 0 ? '#22c55e' : '#ef4444', fontSize: '0.75rem' }}>
                {formatCurrency(totals.resultado)}
              </Typography>
            </Stack>
          </Box>
        </Paper>

        {/* Timeline - Lançamentos */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Saldo Anterior */}
          <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e5e7eb' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">Saldo anterior</Typography>
              <Typography variant="h6" color={saldoAnterior >= 0 ? 'success.main' : 'error.main'} fontWeight={600}>
                {formatCurrency(saldoAnterior)}
              </Typography>
            </Stack>
          </Box>

          {/* Lista de lançamentos */}
          <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f9fafb' }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : groupedByDate.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography color="text.secondary">Nenhum lançamento encontrado.</Typography>
                <Button variant="text" onClick={openNew} sx={{ mt: 1 }}>Criar primeiro lançamento</Button>
              </Box>
            ) : (
              <Box>
                {groupedByDate.map(([date, txs]) => {
                  const [year, month, day] = date.split('-')
                  const monthShort = ['', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'][parseInt(month)]
                  const isToday = date === selectedDateStr
                  return (
                    <Box key={date}>
                      {txs.map((tx, idx) => {
                        const isReceita = tx.type === 'RECEITA'
                        const isFirstOfDate = idx === 0
                        const dotColor = getStatusDotColor(tx)
                        const daysOverdue = getDaysOverdue(tx)
                        return (
                          <Paper
                            key={tx.id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 1.5,
                              borderBottom: '1px solid #e5e7eb',
                              bgcolor: 'white',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fafafa' }
                            }}
                            onClick={() => openEdit(tx)}
                          >
                            {/* Ponto + Data (coluna esquerda) */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, minWidth: 80 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                              {isToday ? (
                                <Typography variant="caption"
                                  sx={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.78rem', lineHeight: 1 }}
                                >hoje</Typography>
                              ) : (
                                <Typography variant="caption"
                                  sx={{ color: '#9ca3af', fontSize: '0.72rem', lineHeight: 1, whiteSpace: 'nowrap' }}
                                >{day}/{monthShort}/{year.substring(2)}</Typography>
                              )}
                            </Box>

                            {/* Descrição + linha secundaria com chips */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {tx.description}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.3 }}>
                                {/* Bolinha de atraso (antes dos chips) */}
                                {daysOverdue !== null && (
                                  <Box sx={{
                                    bgcolor: '#ef4444', color: 'white',
                                    borderRadius: '50%', minWidth: 22, height: 22,
                                    fontSize: '0.7rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, px: daysOverdue > 99 ? 0.3 : 0
                                  }}>{daysOverdue}</Box>
                                )}
                                {/* Chip da conta */}
                                {tx.account_name && (
                                  <Box sx={{
                                    bgcolor: '#f3f4f6', color: '#4b5563',
                                    borderRadius: '6px', px: 0.8, py: 0.1,
                                    fontSize: '0.68rem', fontWeight: 600, lineHeight: '18px', flexShrink: 0
                                  }}>{tx.account_name}</Box>
                                )}
                                {/* Transferência: ícone + conta destino + label */}
                                {tx.type === 'TRANSFERENCIA' ? (
                                  <>
                                    <SwapHoriz sx={{ fontSize: '0.95rem', color: '#9ca3af', flexShrink: 0 }} />
                                    {tx.destination_account_name && (
                                      <Typography variant="caption"
                                        sx={{ fontSize: '0.68rem', color: '#6b7280', fontWeight: 500, flexShrink: 0 }}
                                      >{tx.destination_account_name}</Typography>
                                    )}
                                    <Box sx={{
                                      bgcolor: '#f3f4f6', color: '#6b7280',
                                      borderRadius: '6px', px: 0.8, py: 0.1,
                                      fontSize: '0.68rem', lineHeight: '18px', flexShrink: 0
                                    }}>Transferência</Box>
                                  </>
                                ) : (
                                  tx.category_name && (
                                    <Box sx={{
                                      bgcolor: '#f3f4f6', color: '#6b7280',
                                      borderRadius: '6px', px: 0.8, py: 0.1,
                                      fontSize: '0.68rem', lineHeight: '18px', flexShrink: 0
                                    }}>{tx.category_name}</Box>
                                  )
                                )}
                              </Box>
                            </Box>

                            {/* Valor */}
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: isReceita ? '#22c55e' : '#ef4444', minWidth: 80, textAlign: 'right' }}
                            >
                              {isReceita ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </Typography>

                            {/* Ações - Menu de 3 pontinhos */}
                            <IconButton
                              size="small"
                              sx={{ p: 0.5, ml: 0.5 }}
                              onClick={(e) => openMenu(e, tx)}
                            >
                              <MoreIcon fontSize="small" sx={{ fontSize: 18, color: '#6b7280' }} />
                            </IconButton>
                          </Paper>
                        )
                      })}
                    </Box>
                  )
                })}
              </Box>
            )}
          </Box>

          {/* Rodapé vazio - resumo está na sidebar */}
          <Box sx={{ p: 1, borderTop: '1px solid #e5e7eb', bgcolor: 'white' }} />
        </Box>
      </Box>

      {/* FAB Mobile */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 80, right: 16, display: { md: 'none' } }}
        onClick={openNew}
      >
        <AddIcon />
      </Fab>

      {/* Drawer Formulário */}
      <Drawer
        anchor="right"
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editTarget ? 'Editar' : 'Novo'} Lançamento</Typography>
          <IconButton onClick={() => { setFormOpen(false); setEditTarget(null) }}>✕</IconButton>
        </Box>
        {submitError && (
          <Box px={2} pb={1}>
            <Alert severity="error" onClose={() => setSubmitError(null)}>{submitError}</Alert>
          </Box>
        )}
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditTarget(null); setSubmitError(null) }}
          accounts={accounts}
          categories={categories.map(cat => ({ ...cat, type: cat.type || '', children: (cat.children ?? []).map(c => ({ ...c, type: c.type || '', children: [] })) }))}
          settings={DEFAULT_SETTINGS}
          isLoading={isSubmitting}
          initialData={editTarget ? {
            type: editTarget.type as 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA',
            amount: Math.abs(editTarget.amount),
            description: editTarget.description,
            due_date: editTarget.due_date ?? '',
            account_id: editTarget.account_id ?? '',
            category_id: editTarget.category_id ?? '',
            status: editTarget.status as 'PENDENTE' | 'CONFIRMADO',
            regime: 'CAIXA',
            repetition_type: 'NONE',
            tags: [],
          } : undefined}
        />
      </Drawer>

      {/* Menu de Ações - 3 pontinhos */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 200, mt: 0.5 } }}
      >
        <MenuItem onClick={handleConfirm} sx={{ gap: 1.5 }}>
          <DoneIcon fontSize="small" sx={{ color: '#22c55e' }} />
          <Typography variant="body2">Confirmar</Typography>
        </MenuItem>
        <MenuItem onClick={handleConfirmToday} sx={{ gap: 1.5 }}>
          <DoneAllIcon fontSize="small" sx={{ color: '#22c55e' }} />
          <Typography variant="body2">Confirmar hoje</Typography>
        </MenuItem>
        <MenuItem onClick={handleConfirmPartial} sx={{ gap: 1.5 }}>
          <PartialIcon fontSize="small" sx={{ color: '#3b82f6' }} />
          <Typography variant="body2">Confirmar parcialmente</Typography>
        </MenuItem>
        <MenuItem onClick={openConciliationModal} sx={{ gap: 1.5 }}>
          <ConciliatedIcon fontSize="small" sx={{ color: '#8b5cf6' }} />
          <Typography variant="body2">Conciliar</Typography>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleDetail} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" sx={{ color: '#6b7280' }} />
          <Typography variant="body2">Editar</Typography>
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ gap: 1.5, color: '#ef4444' }}>
          <DeleteIcon fontSize="small" />
          <Typography variant="body2">Excluir</Typography>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleClone} sx={{ gap: 1.5 }}>
          <CopyIcon fontSize="small" sx={{ color: '#6b7280' }} />
          <Typography variant="body2">Clonar</Typography>
        </MenuItem>
        <MenuItem onClick={handleDetail} sx={{ gap: 1.5 }}>
          <InfoIcon fontSize="small" sx={{ color: '#6b7280' }} />
          <Typography variant="body2">Detalhar</Typography>
        </MenuItem>
      </Menu>

      {/* Modal de Conciliação */}
      <Dialog
        open={conciliationOpen}
        onClose={closeConciliationModal}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2, minWidth: 600 } }}
      >
        <DialogTitle sx={{ pb: 2, pt: 2.5, px: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h6" fontWeight={600}>
                Conciliar
              </Typography>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {selectedTransaction?.description}
              </Typography>
              {selectedTransaction?.type === 'TRANSFERENCIA' && (
                <SwapHoriz sx={{ color: '#14b8a6', fontSize: 24 }} />
              )}
            </Stack>
            <IconButton onClick={closeConciliationModal} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 4, pb: 2, px: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            {/* Valor efetivo */}
            <TextField
              label="Valor efetivo (R$)"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.amount}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9,]/g, '')
                const parts = val.split(',')
                if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('')
                if (parts[1] && parts[1].length > 2) val = parts[0] + ',' + parts[1].slice(0, 2)
                setConciliationData(prev => ({ ...prev, amount: val }))
              }}
              placeholder="0,00"
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
              InputLabelProps={{ shrink: true }}
            />

            {/* Data efetiva */}
            <TextField
              label="Data efetiva"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.date}
              onChange={(e) => setConciliationData(prev => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />

            {/* Descrição */}
            <TextField
              label="Descrição"
              size="small"
              fullWidth
              margin="normal"
              value={selectedTransaction?.description || ''}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#f8fafc' }}
            />

            {/* Conta */}
            <FormControl size="small" fullWidth margin="normal">
              <InputLabel id="conta-select-label" shrink>Conta</InputLabel>
              <Select
                labelId="conta-select-label"
                id="conta-select"
                value={conciliationData.accountId}
                label="Conta"
                onChange={(e) => setConciliationData(prev => ({ ...prev, accountId: e.target.value }))}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Categoria */}
            <TextField
              label="Categoria"
              size="small"
              fullWidth
              margin="normal"
              value={selectedTransaction?.category_name || '—'}
              InputProps={{ readOnly: true }}
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: '#f8fafc' }}
            />

            {/* Competência */}
            <TextField
              label="Competência"
              type="month"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.date ? conciliationData.date.substring(0, 7) : ''}
              onChange={(e) => {
                const month = e.target.value
                const day = conciliationData.date ? conciliationData.date.substring(8, 10) : '01'
                setConciliationData(prev => ({ ...prev, date: `${month}-${day}` }))
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Número do documento */}
          <TextField
            label="Número do documento"
            size="small"
            fullWidth
            margin="normal"
            value={conciliationData.documentNumber}
            onChange={(e) => {
              const val = e.target.value.slice(0, 80)
              setConciliationData(prev => ({ ...prev, documentNumber: val }))
            }}
            placeholder="Ex: 12345"
            helperText={`${conciliationData.documentNumber.length} / 80`}
            FormHelperTextProps={{ sx: { textAlign: 'right' } }}
            InputLabelProps={{ shrink: true }}
          />

          {/* Observações */}
          <TextField
            label="Observações"
            size="small"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={conciliationData.notes}
            onChange={(e) => {
              const val = e.target.value.slice(0, 400)
              setConciliationData(prev => ({ ...prev, notes: val }))
            }}
            placeholder="Adicione observações..."
            helperText={`${conciliationData.notes.length} / 400`}
            FormHelperTextProps={{ sx: { textAlign: 'right' } }}
            InputLabelProps={{ shrink: true }}
          />

          {/* Tags */}
          <TextField
            label="Tags"
            size="small"
            fullWidth
            margin="normal"
            value={conciliationData.tags}
            onChange={(e) => setConciliationData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="tag1, tag2, tag3"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <IconButton sx={{ mr: 'auto' }}>
            <AttachFileIcon fontSize="small" />
          </IconButton>
          <Button onClick={closeConciliationModal} variant="outlined" size="small">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitConciliation}
            variant="contained"
            size="small"
            sx={{
              bgcolor: '#14b8a6',
              '&:hover': { bgcolor: '#0d9488' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Conciliar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
