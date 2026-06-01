/**
 * 📄 Descrição: Página de Lançamentos de Caixa - Layout Moderno
 * 🧱 Contexto: Tela principal de gestão financeira
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-01-26
 * ⚙️ Tecnologias: Next.js, React, TypeScript, Material-UI
 * 🔍 Dependências: TransactionForm, formatCurrency, formatDate, filterTransactionsForList
 * ✅ Revisado: Sim
 */

'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Checkbox,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  Fab,
  Drawer,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material'
import {
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  CalendarToday as CalendarIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Info as InfoIcon,
  MoreVert as MoreIcon,
  Close as CloseIcon,
  SwapHoriz,
  AttachFile as AttachFileIcon,
  ViewDay as ViewDayIcon,
  DateRange as DateRangeIcon,
  CalendarMonth as CalendarMonthIcon
} from '@mui/icons-material'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { TransactionFormData } from '@/components/transactions/TransactionForm'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'
import { filterTransactionsForList, getDisplayDateLabel } from '@/utils/filterTransactionsForList'

// Configuração de status
const STATUS_CONFIG = {
  PENDENTE: {
    label: 'Pendentes',
    color: '#ef4444',
    bgColor: '#fef2f2',
    textColor: '#991b1b'
  },
  AGENDADO: {
    label: 'Agendados',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    textColor: '#92400e'
  },
  CONFIRMADO: {
    label: 'Confirmados',
    color: '#22c55e',
    bgColor: '#f0fdf4',
    textColor: '#166534'
  },
  CONCILIADO: {
    label: 'Conciliados',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    textColor: '#0e7490'
  }
}

// Helper: converte Date para string YYYY-MM-DD usando timezone local
function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Retorna a cor da bolinha de status
const getStatusDotColor = (tx: { status: string; due_date: string }): string => {
  if (tx.status === 'CONCILIADO') return '#06b6d4'
  if (tx.status === 'CONFIRMADO') return '#22c55e'
  const today = toLocalDateString(new Date())
  if (tx.due_date < today) return '#ef4444'
  return '#f59e0b'
}

// Retorna quantos dias de atraso
const getDaysOverdue = (tx: { status: string; due_date: string }): number | null => {
  if (tx.status !== 'PENDENTE') return null
  const today = new Date()
  const dueDate = new Date(tx.due_date + 'T12:00:00')
  const diff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// Helper: retorna início (Segunda) e fim (Domingo) da semana que contém a data
function getWeekRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay() // 0=Dom…6=Sab
  const diffToMonday = day === 0 ? -6 : 1 - day
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday)
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + diffToMonday + 6)
  return { start, end }
}

// Helper: retorna primeiro e último dia do mês da data
function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start, end }
}

// Tipos
interface Account {
  id: string
  name: string
  type: string
  initialBalance?: number
}

interface Category {
  id: string
  name: string
  type: string
  children: Category[]
}

interface Transaction {
  id: string
  account_id: string
  account_name?: string
  category_name?: string
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO'
  amount: number
  due_date: string
  payment_date?: string
  description: string
  document_number?: string
  notes?: string
  tags?: string[]
  competence_date?: string
  is_recurring?: boolean
}

export default function LancamentosCaixaPage() {
  // Estados
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['PENDENTE', 'AGENDADO', 'CONFIRMADO', 'CONCILIADO'])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [conciliationOpen, setConciliationOpen] = useState(false)
  const [conciliationData, setConciliationData] = useState({
    amount: '',
    date: '',
    accountId: '',
    documentNumber: '',
    notes: '',
    tags: ''
  })

  // Data formatada
  const currentDateStr = useMemo(() => formatDate(currentDate.toISOString()), [currentDate])
  const selectedDateStr = useMemo(() => toLocalDateString(currentDate), [currentDate])
  const todayStr = useMemo(() => toLocalDateString(new Date()), [])

  // Período baseado no modo de visualização
  const periodRange = useMemo(() => {
    if (viewMode === 'week') return getWeekRange(currentDate)
    if (viewMode === 'month') return getMonthRange(currentDate)
    return { start: currentDate, end: currentDate }
  }, [viewMode, currentDate])

  const periodStartStr = useMemo(() => toLocalDateString(periodRange.start), [periodRange])
  const periodEndStr = useMemo(() => toLocalDateString(periodRange.end), [periodRange])

  const periodLabel = useMemo(() => {
    if (viewMode === 'day') return currentDateStr
    if (viewMode === 'week') {
      const { start, end } = periodRange
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      return `${fmt(start)} – ${fmt(end)}/${end.getFullYear()}`
    }
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [viewMode, currentDate, currentDateStr, periodRange])

  // Buscar dados
  useEffect(() => {
    fetch('/api/accounts?balances=true')
      .then(r => r.json())
      .then(accs => {
        setAccounts(Array.isArray(accs) ? accs : [])
        setSelectedAccounts(accs.map((a: Account) => a.id))
      })
      .catch(() => setError('Erro ao carregar contas'))

    fetch('/api/categories')
      .then(r => r.json())
      .then(cats => {
        const catsWithChildren = Array.isArray(cats)
          ? cats.map((c: Category) => ({ ...c, children: c.children || [] }))
          : []
        setCategories(catsWithChildren)
      })
      .catch(() => {/* ignore */ })
  }, [])

  // Buscar transações
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '2000')
      if (searchTerm) params.set('search', searchTerm)

      if (viewMode === 'day') {
        const selectedDate = toLocalDateString(currentDate)
        const today = toLocalDateString(new Date())
        params.set('endDate', selectedDate > today ? selectedDate : today)
      } else {
        const range = viewMode === 'week' ? getWeekRange(currentDate) : getMonthRange(currentDate)
        params.set('startDate', toLocalDateString(range.start))
        params.set('endDate', toLocalDateString(range.end))
      }

      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error()

      const data = await res.json()
      const allTxs: Transaction[] = Array.isArray(data) ? data : (data.data ?? [])

      // Deduplicação por ID (garante unicidade mesmo em edge cases)
      const dedupMap = new Map<string, Transaction>()
      allTxs.forEach(t => { if (!dedupMap.has(t.id)) dedupMap.set(t.id, t) })
      setTransactions(Array.from(dedupMap.values()))
    } catch {
      setError('Erro ao carregar lançamentos.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, currentDate, viewMode])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const statusMatch = selectedStatuses.includes(tx.status)
      const accountMatch = selectedAccounts.includes(tx.account_id || '')
      return statusMatch && accountMatch
    })
  }, [transactions, selectedStatuses, selectedAccounts])

  // Lista de transações com regra de negócio
  const listTransactions = useMemo(() => {
    if (viewMode === 'day') {
      return filterTransactionsForList(filteredTransactions, selectedDateStr, todayStr)
    }
    // Semana/Mês: mostra todos os lançamentos do período
    const range = viewMode === 'week' ? getWeekRange(currentDate) : getMonthRange(currentDate)
    const startStr = toLocalDateString(range.start)
    const endStr = toLocalDateString(range.end)
    return filteredTransactions.filter(tx => {
      const effDate = tx.status === 'CONCILIADO' && tx.payment_date ? tx.payment_date : tx.due_date
      return effDate >= startStr && effDate <= endStr
    })
  }, [viewMode, filteredTransactions, selectedDateStr, todayStr, currentDate])

  // Calcular saldo anterior (até o dia anterior à data selecionada)
  const previousBalance = useMemo(() => {
    const previousDateStr = getPreviousDay(selectedDateStr)

    // Soma dos saldos iniciais das contas selecionadas
    const initialBalanceSum = accounts
      .filter(acc => selectedAccounts.includes(acc.id))
      .reduce((sum, acc) => sum + (acc.initialBalance || 0), 0)

    // Soma das transações confirmadas/conciliadas até o dia anterior
    const transactionsSum = transactions
      .filter(t => {
        const effDate = t.status === 'CONCILIADO' && t.payment_date ? t.payment_date : t.due_date
        return selectedAccounts.includes(t.account_id) &&
          effDate <= previousDateStr &&
          ['CONFIRMADO', 'CONCILIADO'].includes(t.status)
      })
      .reduce((sum, t) => {
        if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
        if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
        if (t.type === 'TRANSFERENCIA') return sum - Math.abs(t.amount) // Transferência é saída da conta
        return sum
      }, 0)

    return initialBalanceSum + transactionsSum
  }, [transactions, accounts, selectedAccounts, selectedDateStr])

  // Calcular saldos por conta
  const accountBalances = useMemo(() => {
    const balances: { [accountId: string]: { confirmed: number; projected: number } } = {}

    accounts.forEach(acc => {
      const initial = acc.initialBalance || 0
      const txsUntilDate = transactions.filter(t => {
        const effDate = t.status === 'CONCILIADO' && t.payment_date ? t.payment_date : t.due_date
        return effDate <= selectedDateStr && t.account_id === acc.id
      })

      const confirmed = txsUntilDate
        .filter(t => ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
        .reduce((sum, t) => {
          if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
          if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
          if (t.type === 'TRANSFERENCIA') return sum - Math.abs(t.amount) // Transferência é saída da conta
          return sum
        }, initial)

      const projected = txsUntilDate
        .reduce((sum, t) => {
          if (t.type === 'RECEITA') return sum + Math.abs(t.amount)
          if (t.type === 'DESPESA') return sum - Math.abs(t.amount)
          if (t.type === 'TRANSFERENCIA') return sum - Math.abs(t.amount) // Transferência é saída da conta
          return sum
        }, initial)

      balances[acc.id] = { confirmed, projected }
    })

    return balances
  }, [transactions, accounts, selectedDateStr])

  // Agrupar por data
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    listTransactions.forEach(tx => {
      const date = tx.due_date
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }, [listTransactions])

  // Toggle status
  const toggleStatus = (key: string) => {
    setSelectedStatuses(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Toggle account
  const toggleAccount = (id: string) => {
    setSelectedAccounts(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  // Navegação de data
  const goToPrev = () => {
    setCurrentDate(prev => {
      const nd = new Date(prev)
      if (viewMode === 'day') nd.setDate(nd.getDate() - 1)
      else if (viewMode === 'week') nd.setDate(nd.getDate() - 7)
      else { nd.setDate(1); nd.setMonth(nd.getMonth() - 1) }
      return nd
    })
  }
  const goToNext = () => {
    setCurrentDate(prev => {
      const nd = new Date(prev)
      if (viewMode === 'day') nd.setDate(nd.getDate() + 1)
      else if (viewMode === 'week') nd.setDate(nd.getDate() + 7)
      else { nd.setDate(1); nd.setMonth(nd.getMonth() + 1) }
      return nd
    })
  }
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Handlers
  const openNew = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit = (tx: Transaction) => { setEditTarget(tx); setFormOpen(true) }

  const closeMenu = () => { setMenuAnchor(null); setSelectedTransaction(null) }

  const handleConfirmToday = async () => {
    if (!selectedTransaction) return
    const today = toLocalDateString(new Date())
    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CONFIRMADO', due_date: today })
    })
    fetchTransactions()
    closeMenu()
  }

  const openConciliationModal = () => {
    if (!selectedTransaction) return
    const formattedAmount = selectedTransaction.amount
      ? Math.abs(selectedTransaction.amount).toFixed(2).replace('.', ',')
      : '0,00'
    // Se ja conciliado, usar payment_date como data efetiva; senao, usar competence_date ou due_date
    const dateToUse = selectedTransaction.status === 'CONCILIADO' && selectedTransaction.payment_date
      ? selectedTransaction.payment_date
      : (selectedTransaction.competence_date
        || selectedTransaction.due_date
        || toLocalDateString(new Date()))

    setConciliationData({
      amount: formattedAmount,
      date: dateToUse,
      accountId: selectedTransaction.account_id || '',
      documentNumber: selectedTransaction.document_number || '',
      notes: selectedTransaction.notes || '',
      tags: selectedTransaction.tags?.join(', ') || ''
    })
    setMenuAnchor(null)
    setConciliationOpen(true)
  }

  const closeConciliationModal = () => {
    setConciliationOpen(false)
    setSelectedTransaction(null)
    setSubmitError(null)
  }

  const handleSubmitConciliation = async () => {
    if (!selectedTransaction) return
    try {
      const amountStr = conciliationData.amount.replace(/\./g, '').replace(',', '.')
      const amount = parseFloat(amountStr) || selectedTransaction.amount

      const res = await fetch(
        `/api/transactions/${selectedTransaction.id}?action=reconcile`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentDate: conciliationData.date || undefined,
            amount: amount !== selectedTransaction.amount ? amount : undefined,
            accountId: conciliationData.accountId || undefined,
            notes: conciliationData.notes || undefined,
          }),
        }
      )
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setSubmitError(data?.error || 'Erro ao conciliar lançamento.')
        return
      }
    } catch {
      setSubmitError('Erro ao conciliar lançamento.')
      return
    }
    closeConciliationModal()
    fetchTransactions()
  }

  const handleSubmit = async (formData: TransactionFormData) => {
    if (submitting) return
    setSubmitting(true)
    try {
      // Se editTarget.id for vazio (clone), tratar como novo lançamento (POST)
      const isEdit = editTarget && editTarget.id
      const url = isEdit ? `/api/transactions/${editTarget.id}` : '/api/transactions'
      const method = isEdit ? 'PUT' : 'POST'

      // Transforma snake_case do formulário para camelCase da API
      const payload: Record<string, unknown> = {
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        dueDate: formData.due_date,
        accountId: formData.account_id || undefined,
        status: formData.status || 'PENDENTE',
        regime: formData.regime || 'CAIXA',
        isRecurring: formData.repetition_type !== 'NONE',
        tags: (formData.tags || []).filter(Boolean),
      }

      if (formData.category_id) payload.categoryId = formData.category_id
      if (formData.center_id) payload.centerId = formData.center_id
      if (formData.project_id) payload.projectId = formData.project_id
      if (formData.contact_id) payload.contactId = formData.contact_id
      if (formData.competence_date) payload.competenceDate = formData.competence_date
      if (formData.notes) payload.notes = formData.notes

      // Transferência: enviar conta destino em transferData
      if (formData.type === 'TRANSFERENCIA' && formData.destination_account_id) {
        payload.transferData = { destinationAccountId: formData.destination_account_id }
      }

      // Recorrência parcelada
      if (formData.repetition_type === 'PARCELADO' && formData.installments) {
        payload.recurrenceData = {
          type: 'PARCELADA',
          totalInstallments: formData.installments,
          installmentAmount: formData.installment_amount,
          firstDueDate: formData.due_date,
        }
      } else if (formData.repetition_type === 'FIXO') {
        payload.recurrenceData = {
          type: 'FIXA',
          frequency: 'MENSAL',
          months: formData.fixed_months,
        }
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || 'Erro ao salvar')
      }

      setFormOpen(false)
      setEditTarget(null)
      fetchTransactions()
    } catch (e: any) {
      setSubmitError(e?.message || 'Erro ao salvar lançamento.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedTransaction) return
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await fetch(`/api/transactions/${selectedTransaction.id}`, { method: 'DELETE' })
      fetchTransactions()
    }
    closeMenu()
  }

  const handleClone = () => {
    if (!selectedTransaction) return
    const cloned: TransactionFormData = {
      account_id: selectedTransaction.account_id,
      type: selectedTransaction.type,
      amount: Math.abs(selectedTransaction.amount),
      due_date: selectedTransaction.due_date,
      description: selectedTransaction.description + ' (cópia)',
      status: 'PENDENTE',
      category_id: '',
      center_id: '',
      project_id: '',
      contact_id: '',
      notes: selectedTransaction.notes || '',
      tags: selectedTransaction.tags || [],
      regime: 'CAIXA',
      repetition_type: 'NONE'
    }
    setEditTarget({ ...selectedTransaction, id: '' })
    setFormOpen(true)
    closeMenu()
  }

  const handleDetail = () => {
    closeMenu()
  }

  // Cores do modelo
  const colors = {
    primary: '#00a86b',
    primaryHover: '#008f5b',
    textPrimary: '#1a1a2e',
    textSecondary: '#5f6368',
    textMuted: '#9aa0a6',
    border: '#e8eaed',
    bgPage: '#f0f2f5',
    bgCard: '#ffffff',
    bgSidebar: '#fafbfc',
    success: '#00a86b',
    danger: '#e53935',
    warning: '#f59e0b',
    info: '#06b6d4'
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: colors.bgPage }}>
      {/* Header Principal */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.border}`,
          bgcolor: 'white'
        }}
      >
        <Typography variant="h6" fontWeight={600} color={colors.textPrimary}>
          Lançamentos de caixa
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton size="small" sx={{ color: colors.textSecondary }}>
            <SearchIcon />
          </IconButton>
          <IconButton size="small" sx={{ color: colors.textSecondary }}>
            <SettingsIcon />
          </IconButton>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{
              bgcolor: colors.primary,
              '&:hover': { bgcolor: colors.primaryHover },
              textTransform: 'none',
              fontWeight: 500,
              borderRadius: '8px',
              px: 2
            }}
          >
            + Novo
          </Button>
        </Stack>
      </Paper>

      {/* Card Principal Central */}
      <Box sx={{ flex: 1, p: 3, overflow: 'hidden' }}>
        <Paper
          elevation={0}
          sx={{
            height: '100%',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: 'white',
            maxWidth: 1400,
            mx: 'auto'
          }}
        >
          {/* Barra de Data e Filtros */}
          <Box
            sx={{
              p: 2,
              borderBottom: `1px solid ${colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: 'white'
            }}
          >
            {/* Navegação de Data + Toggle Modo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Toggle Diário / Semanal / Mensal */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, val) => { if (val) setViewMode(val) }}
                size="small"
                sx={{
                  '& .MuiToggleButton-root': {
                    px: 1, py: 0.4, border: `1px solid ${colors.border}`,
                    fontSize: '0.7rem', fontWeight: 600, color: colors.textSecondary,
                    '&.Mui-selected': { bgcolor: colors.primary, color: 'white', borderColor: colors.primary }
                  }
                }}
              >
                <Tooltip title="Diário">
                  <ToggleButton value="day"><ViewDayIcon sx={{ fontSize: 16 }} /></ToggleButton>
                </Tooltip>
                <Tooltip title="Semanal">
                  <ToggleButton value="week"><DateRangeIcon sx={{ fontSize: 16 }} /></ToggleButton>
                </Tooltip>
                <Tooltip title="Mensal">
                  <ToggleButton value="month"><CalendarMonthIcon sx={{ fontSize: 16 }} /></ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>

              {/* Setas de navegação + Label do período */}
              <IconButton
                size="small"
                onClick={goToPrev}
                sx={{ color: colors.textSecondary, '&:hover': { bgcolor: '#f5f5f5' } }}
              >
                <PrevIcon fontSize="small" />
              </IconButton>

              <Box
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                  px: 1.5, py: 0.5, borderRadius: '8px', '&:hover': { bgcolor: '#f5f5f5' }
                }}
                onClick={() => dateInputRef.current?.showPicker?.()}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 500, fontSize: '1rem', color: colors.textPrimary,
                    minWidth: viewMode === 'week' ? 160 : 100, textAlign: 'center'
                  }}
                >
                  {periodLabel}
                </Typography>
                <CalendarIcon fontSize="small" sx={{ color: colors.textSecondary }} />
              </Box>

              <IconButton
                size="small"
                onClick={goToNext}
                sx={{ color: colors.textSecondary, '&:hover': { bgcolor: '#f5f5f5' } }}
              >
                <NextIcon fontSize="small" />
              </IconButton>

              {/* Input oculto para seleção de data/semana/mês */}
              <input
                ref={dateInputRef}
                type={viewMode === 'month' ? 'month' : 'date'}
                value={viewMode === 'month'
                  ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                  : toLocalDateString(currentDate)
                }
                onChange={(e) => {
                  if (!e.target.value) return
                  if (viewMode === 'month') {
                    const [y, m] = e.target.value.split('-').map(Number)
                    setCurrentDate(new Date(y, m - 1, 1))
                  } else {
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    setCurrentDate(new Date(y, m - 1, d))
                  }
                }}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
            </Box>

            {/* Filtros de Status */}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Filtrar:
              </Typography>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <Chip
                  key={key}
                  label={cfg.label}
                  size="small"
                  onClick={() => toggleStatus(key)}
                  sx={{
                    bgcolor: selectedStatuses.includes(key) ? cfg.bgColor : 'transparent',
                    color: selectedStatuses.includes(key) ? cfg.textColor : colors.textSecondary,
                    border: '2px solid',
                    borderColor: selectedStatuses.includes(key) ? cfg.color : colors.border,
                    fontWeight: selectedStatuses.includes(key) ? 600 : 400,
                    fontSize: '0.8125rem',
                    cursor: 'pointer',
                    borderRadius: '20px',
                    px: 1,
                    '&:hover': {
                      bgcolor: selectedStatuses.includes(key) ? cfg.bgColor : '#f8f9fa',
                      borderColor: cfg.color
                    }
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Conteúdo Principal - Contas + Lançamentos */}
          <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Sidebar - Contas */}
            <Box
              sx={{
                width: 340,
                borderRight: `1px solid ${colors.border}`,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: colors.bgSidebar
              }}
            >
              {/* Header Contas */}
              <Box
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  bgcolor: 'white'
                }}
              >
                <Box sx={{ width: 40 }} />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ flex: 1, fontSize: '0.75rem', letterSpacing: '0.5px' }}
                >
                  CONTAS
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ width: 85, textAlign: 'right', fontSize: '0.7rem' }}
                >
                  Confirmado
                </Typography>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ width: 85, textAlign: 'right', fontSize: '0.7rem', ml: 1.5 }}
                >
                  Projetado
                </Typography>
              </Box>

              {/* Lista de Contas */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                {accounts.map(acc => {
                  const bal = accountBalances[acc.id] || { confirmed: 0, projected: 0 }
                  return (
                    <Box
                      key={acc.id}
                      sx={{
                        p: 2,
                        borderBottom: `1px solid ${colors.border}`,
                        bgcolor: selectedAccounts.includes(acc.id) ? '#f0f7ff' : 'transparent',
                        '&:hover': { bgcolor: '#f5f5f5' },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Checkbox
                          size="small"
                          checked={selectedAccounts.includes(acc.id)}
                          onChange={() => toggleAccount(acc.id)}
                          sx={{ p: 0.5 }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ fontSize: '0.875rem', color: colors.textPrimary }}
                          >
                            {acc.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'uppercase' }}
                          >
                            {acc.type}
                          </Typography>
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            width: 85,
                            textAlign: 'right',
                            fontSize: '0.875rem',
                            color: bal.confirmed >= 0 ? colors.success : colors.danger,
                            fontWeight: 500
                          }}
                        >
                          {formatCurrency(bal.confirmed)}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            width: 85,
                            textAlign: 'right',
                            fontSize: '0.875rem',
                            color: bal.projected >= 0 ? colors.success : colors.danger,
                            ml: 1.5,
                            fontWeight: 500
                          }}
                        >
                          {formatCurrency(bal.projected)}
                        </Typography>
                      </Stack>
                    </Box>
                  )
                })}
              </Box>
            </Box>

            {/* Timeline - Lançamentos */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: colors.bgPage }}>
              {/* Saldo Anterior */}
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderBottom: `1px solid ${colors.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Saldo anterior
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={previousBalance >= 0 ? colors.success : colors.danger}
                >
                  {formatCurrency(previousBalance)}
                </Typography>
              </Box>

              {/* Lista de Lançamentos */}
              <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                {loading ? (
                  <Box display="flex" justifyContent="center" py={6}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Alert severity="error">{error}</Alert>
                ) : groupedByDate.length === 0 ? (
                  <Box textAlign="center" py={6}>
                    <Typography color="text.secondary">Nenhum lançamento encontrado.</Typography>
                    <Button variant="text" onClick={openNew} sx={{ mt: 1 }}>
                      Criar primeiro lançamento
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    {groupedByDate.map(([date, txs]) => {
                      const dateLabel = getDisplayDateLabel(date, todayStr)
                      const isToday = dateLabel === 'hoje'

                      return (
                        <Box key={date}>
                          {txs.map((tx, idx) => {
                            const isReceita = tx.type === 'RECEITA'
                            const dotColor = getStatusDotColor(tx)
                            const daysOverdue = getDaysOverdue(tx)

                            return (
                              <Paper
                                key={tx.id}
                                elevation={0}
                                sx={{
                                  p: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2,
                                  borderRadius: '12px',
                                  bgcolor: 'white',
                                  cursor: 'pointer',
                                  mb: 1,
                                  '&:hover': { bgcolor: '#fafafa', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
                                  transition: 'all 0.2s'
                                }}
                                onClick={() => openEdit(tx)}
                              >
                                {/* Indicador de Status + Data */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 90 }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: dotColor }} />
                                  {isToday ? (
                                    <Typography
                                      variant="caption"
                                      sx={{ color: colors.warning, fontWeight: 700, fontSize: '0.875rem' }}
                                    >
                                      hoje
                                    </Typography>
                                  ) : (
                                    <Typography
                                      variant="caption"
                                      sx={{ color: colors.textMuted, fontSize: '0.875rem' }}
                                    >
                                      {dateLabel}
                                    </Typography>
                                  )}
                                </Box>

                                {/* Descrição e Detalhes */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body1"
                                    fontWeight={600}
                                    noWrap
                                    sx={{ color: colors.textPrimary, fontSize: '0.9375rem' }}
                                  >
                                    {tx.description}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    {daysOverdue && (
                                      <Box
                                        sx={{
                                          bgcolor: colors.danger,
                                          color: 'white',
                                          borderRadius: '50%',
                                          minWidth: 22,
                                          height: 22,
                                          fontSize: '0.75rem',
                                          fontWeight: 700,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        {daysOverdue}
                                      </Box>
                                    )}
                                    {tx.account_name && (
                                      <Box
                                        sx={{
                                          bgcolor: '#f3f4f6',
                                          color: colors.textSecondary,
                                          borderRadius: '6px',
                                          px: 1,
                                          py: 0.25,
                                          fontSize: '0.75rem',
                                          fontWeight: 500
                                        }}
                                      >
                                        {tx.account_name}
                                      </Box>
                                    )}
                                    {tx.category_name && (
                                      <Box
                                        sx={{
                                          bgcolor: '#e8f5e9',
                                          color: colors.success,
                                          borderRadius: '6px',
                                          px: 1,
                                          py: 0.25,
                                          fontSize: '0.75rem',
                                          fontWeight: 500
                                        }}
                                      >
                                        {tx.category_name}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>

                                {/* Valor */}
                                <Typography
                                  variant="body1"
                                  fontWeight={600}
                                  sx={{
                                    color: isReceita ? colors.success : colors.danger,
                                    minWidth: 100,
                                    textAlign: 'right',
                                    fontSize: '0.9375rem'
                                  }}
                                >
                                  {tx.amount > 0 ? '+' : tx.amount < 0 ? '-' : ''}{formatCurrency(Math.abs(tx.amount))}
                                </Typography>

                                {/* Menu */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedTransaction(tx)
                                    setMenuAnchor(e.currentTarget)
                                  }}
                                  sx={{ color: colors.textMuted }}
                                >
                                  <MoreIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            )
                          })}
                        </Box>
                      )
                    })}
                  </Stack>
                )}
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Menu de Ações */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {selectedTransaction?.status === 'PENDENTE' && (
          <MenuItem onClick={handleConfirmToday} sx={{ gap: 1.5 }}>
            <Typography variant="body2" color={colors.success}>Confirmar hoje</Typography>
          </MenuItem>
        )}
        <MenuItem onClick={openConciliationModal} sx={{ gap: 1.5 }}>
          <Typography variant="body2">Conciliar</Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ gap: 1.5 }}>
          <DeleteIcon fontSize="small" sx={{ color: colors.danger }} />
          <Typography variant="body2" color={colors.danger}>Excluir</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClone} sx={{ gap: 1.5 }}>
          <CopyIcon fontSize="small" sx={{ color: colors.textSecondary }} />
          <Typography variant="body2">Clonar</Typography>
        </MenuItem>
        <MenuItem onClick={handleDetail} sx={{ gap: 1.5 }}>
          <InfoIcon fontSize="small" sx={{ color: colors.textSecondary }} />
          <Typography variant="body2">Detalhar</Typography>
        </MenuItem>
      </Menu>

      {/* Drawer Formulário */}
      <Drawer
        anchor="right"
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>
            {editTarget ? 'Editar' : 'Novo'} Lançamento
          </Typography>
          <IconButton onClick={() => { setFormOpen(false); setEditTarget(null) }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {submitError && (
          <Box px={2} pb={1}>
            <Alert severity="error" onClose={() => setSubmitError(null)}>{submitError}</Alert>
          </Box>
        )}
        <TransactionForm
          initialData={editTarget ? {
            account_id: editTarget.account_id,
            type: editTarget.type,
            amount: Math.abs(editTarget.amount),
            due_date: editTarget.due_date,
            description: editTarget.description,
            status: (editTarget.status === 'AGENDADO' ? 'PENDENTE' : editTarget.status) as 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO',
            category_id: '',
            center_id: '',
            project_id: '',
            contact_id: '',
            notes: editTarget.notes || '',
            tags: editTarget.tags || [],
            regime: 'CAIXA',
            repetition_type: 'NONE'
          } : undefined}
          accounts={accounts}
          categories={categories}
          settings={{
            enable_competence_date: true,
            require_cost_center: false,
            require_project: false,
            require_contact: false,
            require_tag: false,
            require_subcategory: false,
            installment_default: 'VALOR_PARCELA'
          }}
          isLoading={submitting}
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditTarget(null) }}
        />
      </Drawer>

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
            <Typography variant="h6" fontWeight={600}>Conciliar Lançamento</Typography>
            <IconButton onClick={closeConciliationModal} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: 2, px: 3 }}>
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError(null)} sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2 }}>
            <TextField
              label="Valor efetivo (R$)"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.amount}
              onChange={(e) => setConciliationData(prev => ({ ...prev, amount: e.target.value }))}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
              }}
            />
            <TextField
              label="Data efetiva"
              type="date"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.date}
              onChange={(e) => setConciliationData(prev => ({ ...prev, date: e.target.value }))}
            />
            <FormControl size="small" fullWidth margin="normal">
              <InputLabel>Conta</InputLabel>
              <Select
                value={conciliationData.accountId}
                onChange={(e) => setConciliationData(prev => ({ ...prev, accountId: e.target.value }))}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Número do documento"
              size="small"
              fullWidth
              margin="normal"
              value={conciliationData.documentNumber}
              onChange={(e) => setConciliationData(prev => ({ ...prev, documentNumber: e.target.value }))}
            />
          </Box>
          <TextField
            label="Observações"
            size="small"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={conciliationData.notes}
            onChange={(e) => setConciliationData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeConciliationModal} variant="outlined" size="small">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmitConciliation}
            variant="contained"
            size="small"
            sx={{
              bgcolor: colors.info,
              '&:hover': { bgcolor: '#0e7490' },
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Conciliar
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB Mobile */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { md: 'none' },
          bgcolor: colors.primary,
          '&:hover': { bgcolor: colors.primaryHover }
        }}
        onClick={openNew}
      >
        <AddIcon />
      </Fab>
    </Box>
  )
}

/**
 * Retorna a data anterior (D-1) no formato YYYY-MM-DD
 */
function getPreviousDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00.000Z')
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
