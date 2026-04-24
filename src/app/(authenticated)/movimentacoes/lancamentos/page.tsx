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
import {
  Box, Button, Typography, Drawer, IconButton, Chip, Paper,
  CircularProgress, Alert, Tooltip, Stack, Divider, Checkbox,
  FormControlLabel, ToggleButton, ToggleButtonGroup, Fab, TextField,
  Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment
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
  Info as InfoIcon
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
  account_id?: string
  category_id?: string
  account_name?: string
  category_name?: string
  destination_account_id?: string
  destination_account_name?: string
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
    documentNumber: '',
    notes: '',
    tags: ''
  })

  // Carregar dados
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

  // Buscar transações (desde o início do mês até a data selecionada)
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (searchTerm) params.set('search', searchTerm)

      // Buscar desde o início do mês até a data selecionada
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = currentDate.toISOString().split('T')[0]
      params.set('startDate', startDate)
      params.set('endDate', endDate)

      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : (data.data ?? []))
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

  // Agrupar por data (apenas para timeline - mostrar apenas dia atual)
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    currentDayTransactions.forEach(tx => {
      const date = tx.due_date
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [currentDayTransactions])

  // Calcular totais (apenas do dia selecionado)
  const totals = useMemo(() => {
    const entradas = currentDayTransactions
      .filter(t => t.type === 'RECEITA' && ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const saidas = currentDayTransactions
      .filter(t => t.type === 'DESPESA' && ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const receitasProj = currentDayTransactions
      .filter(t => t.type === 'RECEITA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const despesasProj = currentDayTransactions
      .filter(t => t.type === 'DESPESA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return {
      entradas,
      saidas,
      resultado: entradas - saidas,
      receitas: receitasProj,
      despesas: despesasProj,
      saldoInicial: accounts.filter(a => selectedAccounts.includes(a.id)).reduce((sum, a) => sum + (a.initialBalance || 0), 0)
    }
  }, [currentDayTransactions, accounts, selectedAccounts])

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
      const payload = {
        description: data.description,
        amount: data.amount,
        type: data.type,
        dueDate: toISODate(data.due_date),
        accountId: data.account_id || undefined,
        categoryId: data.category_id || undefined,
        status: data.status || 'CONFIRMADO',
        regime: data.regime || 'CAIXA',
        notes: data.notes || undefined,
        tags: data.tags || [],
        isRecurring: data.repetition_type !== 'NONE',
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
    setConciliationData({
      amount: Math.abs(selectedTransaction.amount).toFixed(2),
      date: selectedTransaction.due_date || new Date().toISOString().split('T')[0],
      documentNumber: '',
      notes: '',
      tags: ''
    })
    setConciliationOpen(true)
    closeMenu()
  }

  const closeConciliationModal = () => {
    setConciliationOpen(false)
    setConciliationData({ amount: '', date: '', documentNumber: '', notes: '', tags: '' })
  }

  const handleSubmitConciliation = async () => {
    if (!selectedTransaction) return

    await fetch(`/api/transactions/${selectedTransaction.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'CONCILIADO',
        amount: parseFloat(conciliationData.amount),
        due_date: conciliationData.date,
        document_number: conciliationData.documentNumber,
        notes: conciliationData.notes,
        tags: conciliationData.tags.split(',').map(t => t.trim()).filter(Boolean)
      })
    })

    fetchTransactions()
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
            {accounts.map(acc => (
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
                      color: acc.confirmedBalance >= 0 ? '#22c55e' : '#ef4444',
                      fontWeight: 500,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {formatCurrency(acc.confirmedBalance)}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      width: 85,
                      textAlign: 'right',
                      fontSize: '0.78rem',
                      color: acc.projectedBalance >= 0 ? '#22c55e' : '#ef4444',
                      ml: 1.5,
                      fontWeight: 500,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {formatCurrency(acc.projectedBalance)}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Box>

          {/* Total */}
          <Box sx={{ p: 1.5, borderTop: '2px solid #e5e7eb', bgcolor: '#f9fafb' }}>
            <Stack direction="row" alignItems="center">
              <Box sx={{ width: 36 }} />
              <Typography variant="body2" fontWeight={700} sx={{ flex: 1, fontSize: '0.85rem' }}>Total</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ width: 85, textAlign: 'right', color: '#22c55e', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                {formatCurrency(accounts.filter(a => selectedAccounts.includes(a.id)).reduce((sum, a) => sum + a.confirmedBalance, 0))}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ width: 85, textAlign: 'right', ml: 1.5, color: '#ef4444', fontSize: '0.85rem', letterSpacing: '0.3px' }}>
                {formatCurrency(accounts.filter(a => selectedAccounts.includes(a.id)).reduce((sum, a) => sum + a.projectedBalance, 0))}
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
                  return (
                    <Box key={date}>
                      {txs.map((tx, idx) => {
                        const isReceita = tx.type === 'RECEITA'
                        const isFirstOfDate = idx === 0
                        return (
                          <Paper
                            key={tx.id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 2,
                              borderBottom: '1px solid #e5e7eb',
                              bgcolor: 'white',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fafafa' }
                            }}
                            onClick={() => openEdit(tx)}
                          >
                            {/* Data com bolinha */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 70 }}>
                              {isFirstOfDate && (
                                <>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ef4444', flexShrink: 0 }} />
                                  <Box>
                                    <Typography variant="body2" fontWeight={700} lineHeight={1.2}>{day}</Typography>
                                    <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{monthShort}/{year.substring(2)}</Typography>
                                  </Box>
                                </>
                              )}
                            </Box>

                            {/* Conta/Categoria indicador */}
                            <Box sx={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                              <AccountIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                              <Box sx={{ width: 1, height: 1, borderRadius: '50%', bgcolor: '#ef4444' }} />
                            </Box>

                            {/* Descrição e detalhes */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {tx.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" fontSize="0.75rem">
                                {tx.status.substring(0, 3).toUpperCase()} • {tx.account_name || '—'} • {tx.category_name || '—'}
                              </Typography>
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
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight={600}>
              Conciliar {selectedTransaction?.description}
            </Typography>
            <IconButton onClick={closeConciliationModal} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2.5}>
            {/* Valor e Data */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Valor efetivo (R$)"
                type="number"
                size="small"
                fullWidth
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
                value={conciliationData.date}
                onChange={(e) => setConciliationData(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>

            {/* Descrição e Tipo (readonly) */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Descrição"
                size="small"
                fullWidth
                value={selectedTransaction?.description || ''}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: '#f9fafb' }}
              />
              <TextField
                label="Tipo"
                size="small"
                fullWidth
                value={selectedTransaction?.type === 'RECEITA' ? 'Receita' : selectedTransaction?.type === 'DESPESA' ? 'Despesa' : 'Transferência'}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: '#f9fafb' }}
              />
            </Stack>

            {/* Contas (readonly) */}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                label="Conta"
                size="small"
                fullWidth
                value={selectedTransaction?.account_name || '—'}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: '#f9fafb' }}
              />
              <SwapHoriz sx={{ color: '#9ca3af' }} />
              <TextField
                label="Conta destino"
                size="small"
                fullWidth
                value={selectedTransaction?.destination_account_name || '—'}
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: '#f9fafb' }}
              />
            </Stack>

            <Divider />

            {/* Número do documento */}
            <TextField
              label="Número do documento"
              size="small"
              fullWidth
              value={conciliationData.documentNumber}
              onChange={(e) => setConciliationData(prev => ({ ...prev, documentNumber: e.target.value }))}
              placeholder="Ex: 12345"
            />

            {/* Observações */}
            <TextField
              label="Observações"
              size="small"
              fullWidth
              multiline
              rows={2}
              value={conciliationData.notes}
              onChange={(e) => setConciliationData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Adicione observações..."
            />

            {/* Tags */}
            <TextField
              label="Tags"
              size="small"
              fullWidth
              value={conciliationData.tags}
              onChange={(e) => setConciliationData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="tag1, tag2, tag3"
              helperText="Separe as tags por vírgula"
            />
          </Stack>
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
              bgcolor: '#14b8a6',
              '&:hover': { bgcolor: '#0d9488' },
              borderRadius: 1.5,
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
