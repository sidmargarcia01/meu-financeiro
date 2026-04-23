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

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Button, Typography, Drawer, IconButton, Chip, Paper,
  CircularProgress, Alert, Tooltip, Stack, Divider, Checkbox,
  FormControlLabel, ToggleButton, ToggleButtonGroup, Fab
} from '@mui/material'
import {
  Add as AddIcon,
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
  MoreVert as MoreIcon
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

  // Buscar transações
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('limit', '100')
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Erro ao carregar lançamentos.')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // Filtrar transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const statusMatch = selectedStatuses.includes(tx.status)
      const accountMatch = selectedAccounts.includes(tx.account_id || '')
      return statusMatch && accountMatch
    })
  }, [transactions, selectedStatuses, selectedAccounts])

  // Agrupar por data
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {}
    filteredTransactions.forEach(tx => {
      const date = tx.due_date
      if (!groups[date]) groups[date] = []
      groups[date].push(tx)
    })
    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
  }, [filteredTransactions])

  // Calcular totais
  const totals = useMemo(() => {
    const entradas = filteredTransactions
      .filter(t => t.type === 'RECEITA' && ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const saidas = filteredTransactions
      .filter(t => t.type === 'DESPESA' && ['CONFIRMADO', 'CONCILIADO'].includes(t.status))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const receitasProj = filteredTransactions
      .filter(t => t.type === 'RECEITA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const despesasProj = filteredTransactions
      .filter(t => t.type === 'DESPESA')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return {
      entradas,
      saidas,
      resultado: entradas - saidas,
      receitas: receitasProj,
      despesas: despesasProj,
      saldoInicial: accounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0)
    }
  }, [filteredTransactions, accounts])

  // Calcular saldo anterior
  const saldoAnterior = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const pastTx = transactions.filter(t => t.due_date < today && selectedAccounts.includes(t.account_id || ''))
    return pastTx.reduce((sum, t) => {
      if (t.type === 'RECEITA') return sum + t.amount
      if (t.type === 'DESPESA') return sum + t.amount
      return sum
    }, 0) + accounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0)
  }, [transactions, selectedAccounts, accounts])

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

  const monthNames = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
  const currentMonthStr = `${currentDate.getDate()} ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" fontWeight={600}>Lançamentos de caixa</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#f3f4f6', borderRadius: 1, px: 1 }}>
            <IconButton size="small" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() - 1)))}>
              <PrevIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ mx: 1, fontWeight: 500, minWidth: 80, textAlign: 'center' }}>
              {currentMonthStr}
            </Typography>
            <IconButton size="small" onClick={() => setCurrentDate(d => new Date(d.setMonth(d.getMonth() + 1)))}>
              <NextIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" sx={{ ml: 1 }}><CalendarIcon fontSize="small" /></IconButton>
          </Box>
        </Stack>

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
        <Paper sx={{ width: 280, borderRadius: 0, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb' }}>
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CONTAS</Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
            {accounts.map(acc => (
              <Box
                key={acc.id}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: selectedAccounts.includes(acc.id) ? '#f3f4f6' : 'transparent',
                  '&:hover': { bgcolor: '#f9fafb' }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Checkbox
                    size="small"
                    checked={selectedAccounts.includes(acc.id)}
                    onChange={() => toggleAccount(acc.id)}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} noWrap>{acc.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{acc.type}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5, pl: 4 }}>
                  <Typography variant="caption" color={acc.confirmedBalance >= 0 ? 'success.main' : 'error.main'}>
                    {formatCurrency(acc.confirmedBalance)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(acc.projectedBalance)}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Box>

          {/* Total */}
          <Box sx={{ p: 2, borderTop: '2px solid #e5e7eb', bgcolor: '#f9fafb' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {formatCurrency(accounts.reduce((sum, a) => sum + a.confirmedBalance, 0))}
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" display="block" align="right">
              {formatCurrency(accounts.reduce((sum, a) => sum + a.projectedBalance, 0))}
            </Typography>
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
          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
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
              <Stack spacing={2}>
                {groupedByDate.map(([date, txs]) => (
                  <Box key={date}>
                    {/* Data */}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'inline-block',
                        bgcolor: '#fee2e2',
                        color: '#991b1b',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontWeight: 600,
                        mb: 1
                      }}
                    >
                      {formatDate(date)}
                    </Typography>

                    {/* Lançamentos do dia */}
                    <Stack spacing={1}>
                      {txs.map(tx => {
                        const isReceita = tx.type === 'RECEITA'
                        const statusCfg = STATUS_CONFIG[tx.status]
                        return (
                          <Paper
                            key={tx.id}
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              borderLeft: 3,
                              borderColor: isReceita ? '#22c55e' : '#ef4444',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: '#fafafa' }
                            }}
                            onClick={() => openEdit(tx)}
                          >
                            {/* Indicador de tipo */}
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: isReceita ? '#dcfce7' : '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              {isReceita ?
                                <ArrowUpIcon sx={{ color: '#22c55e', fontSize: 18 }} /> :
                                <ArrowDownIcon sx={{ color: '#ef4444', fontSize: 18 }} />
                              }
                            </Box>

                            {/* Conteúdo */}
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {tx.description}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={tx.status.substring(0, 3)}
                                  sx={{
                                    bgcolor: statusCfg?.bgColor,
                                    color: statusCfg?.textColor,
                                    fontSize: '10px',
                                    height: 18
                                  }}
                                />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                {tx.account_name || '—'} • {tx.category_name || '—'}
                              </Typography>
                            </Box>

                            {/* Valor */}
                            <Typography
                              variant="subtitle1"
                              fontWeight={700}
                              color={isReceita ? 'success.main' : 'error.main'}
                            >
                              {isReceita ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                            </Typography>

                            {/* Ações */}
                            <Stack direction="row" spacing={0.5}>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(tx) }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(tx.id) }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Paper>
                        )
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Resumo inferior */}
          <Paper sx={{ p: 2, borderRadius: 0, borderTop: '2px solid #e5e7eb' }}>
            <Stack direction="row" justifyContent="space-around" alignItems="center">
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Entradas</Typography>
                <Typography variant="subtitle1" color="success.main" fontWeight={700}>
                  {formatCurrency(totals.entradas)}
                </Typography>
                <Typography variant="caption" color="success.light">
                  {formatCurrency(totals.receitas)}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Saídas</Typography>
                <Typography variant="subtitle1" color="error.main" fontWeight={700}>
                  {formatCurrency(totals.saidas)}
                </Typography>
                <Typography variant="caption" color="error.light">
                  {formatCurrency(totals.despesas)}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="caption" color="text.secondary">Resultado</Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color={totals.resultado >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatCurrency(totals.resultado)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Saldo inicial: {formatCurrency(totals.saldoInicial)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
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
    </Box>
  )
}
