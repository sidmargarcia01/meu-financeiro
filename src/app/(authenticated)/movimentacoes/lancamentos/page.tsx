/**
 * 📄 Descrição: Página de lançamentos financeiros com listagem, filtros e formulário
 * 🧱 Contexto: Módulo 1 — rota /movimentacoes/lancamentos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI, React Query
 * 🔍 Dependências: TransactionForm, formatCurrency, formatDate
 * ✅ Revisado: Sim
 *
 * CAMADA: Page
 * MÓDULO: Transactions
 * RESPONSABILIDADE: Página de lançamentos com listagem, filtros e formulário
 * NÃO DEVE: Conter regras de negócio, calcular saldos
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Button, Typography, Drawer, IconButton,
  Chip, TextField, Select, MenuItem, FormControl,
  InputLabel, Table, TableBody, TableCell, TableHead,
  TableRow, Paper, CircularProgress, Alert, Tooltip,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  CheckCircle as ConfirmedIcon,
  RadioButtonUnchecked as PendingIcon,
  Verified as ConciliatedIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { TransactionFormData } from '@/components/transactions/TransactionForm'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

const STATUS_CONFIG = {
  PENDENTE:   { label: 'Pendente',   color: 'warning' as const, icon: <PendingIcon fontSize="small" /> },
  AGENDADO:   { label: 'Agendado',   color: 'info'    as const, icon: <PendingIcon fontSize="small" /> },
  CONFIRMADO: { label: 'Confirmado', color: 'success' as const, icon: <ConfirmedIcon fontSize="small" /> },
  CONCILIADO: { label: 'Conciliado', color: 'primary' as const, icon: <ConciliatedIcon fontSize="small" /> },
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

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO'
  due_date: string
  account_id: string
  account_name?: string
  category_id?: string
  category_name?: string
}

interface Account { id: string; name: string; type: string }
interface Category { id: string; name: string; type?: string }

export default function LancamentosPage() {
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<Transaction | null>(null)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]     = useState('')
  const [searchTerm, setSearchTerm]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts]         = useState<Account[]>([])
  const [categories, setCategories]     = useState<Category[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)

  // Carregar accounts e categories uma vez
  useEffect(() => {
    Promise.all([
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([accs, cats]) => {
      setAccounts(Array.isArray(accs) ? accs : [])
      setCategories(Array.isArray(cats) ? cats : [])
    }).catch(() => setError('Erro ao carregar dados de suporte.'))
  }, [])

  // Carregar transações com filtros
  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.set('status', filterStatus)
      if (filterType)   params.set('type', filterType)
      if (searchTerm)   params.set('search', searchTerm)
      params.set('limit', '50')
      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Erro ao carregar lançamentos.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterType, searchTerm])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true)
    try {
      const method = editTarget ? 'PUT' : 'POST'
      const url = editTarget ? `/api/transactions/${editTarget.id}` : '/api/transactions'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setFormOpen(false)
        setEditTarget(null)
        fetchTransactions()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchTransactions()
  }

  const openNew   = () => { setEditTarget(null); setFormOpen(true) }
  const openEdit  = (tx: Transaction) => { setEditTarget(tx); setFormOpen(true) }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Lançamentos</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchTransactions} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
            Novo Lançamento
          </Button>
        </Stack>
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3} flexWrap="wrap">
        <TextField
          size="small" placeholder="Buscar..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label="Status">
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="PENDENTE">Pendente</MenuItem>
            <MenuItem value="AGENDADO">Agendado</MenuItem>
            <MenuItem value="CONFIRMADO">Confirmado</MenuItem>
            <MenuItem value="CONCILIADO">Conciliado</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} label="Tipo">
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="RECEITA">Receita</MenuItem>
            <MenuItem value="DESPESA">Despesa</MenuItem>
            <MenuItem value="TRANSFERENCIA">Transferência</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabela */}
      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Conta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Valor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhum lançamento encontrado.</Typography>
                    <Button variant="text" size="small" onClick={openNew} sx={{ mt: 1 }}>
                      Criar primeiro lançamento
                    </Button>
                  </TableCell>
                </TableRow>
              ) : transactions.map(tx => {
                const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDENTE
                return (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.category_name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.account_name ?? '—'}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(tx.due_date)}</TableCell>
                    <TableCell align="right" sx={{ color: tx.type === 'RECEITA' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {tx.type === 'RECEITA' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip label={statusCfg.label} color={statusCfg.color} size="small" icon={statusCfg.icon} variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => openEdit(tx)}><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => handleDelete(tx.id)}><DeleteIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Drawer com formulário */}
      <Drawer
        anchor="right" open={formOpen} onClose={() => { setFormOpen(false); setEditTarget(null) }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editTarget ? 'Editar Lançamento' : 'Novo Lançamento'}</Typography>
          <IconButton onClick={() => { setFormOpen(false); setEditTarget(null) }}>✕</IconButton>
        </Box>
        <TransactionForm
          onSubmit={handleSubmit}
          onCancel={() => { setFormOpen(false); setEditTarget(null) }}
          accounts={accounts}
          categories={categories.map(cat => ({ ...cat, children: [], type: cat.type || '' }))}
          settings={DEFAULT_SETTINGS}
          isLoading={isSubmitting}
          initialData={editTarget ? {
            type: editTarget.type as 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA',
            amount: editTarget.amount,
            description: editTarget.description,
            due_date: editTarget.due_date,
            account_id: editTarget.account_id,
            category_id: editTarget.category_id,
            status: (editTarget.status === 'CONCILIADO' || editTarget.status === 'AGENDADO') ? 'PENDENTE' : editTarget.status as 'PENDENTE' | 'CONFIRMADO',
            regime: 'CAIXA',
            repetition_type: 'NONE',
            tags: [],
          } : undefined}
        />
      </Drawer>
    </Box>
  )
}
