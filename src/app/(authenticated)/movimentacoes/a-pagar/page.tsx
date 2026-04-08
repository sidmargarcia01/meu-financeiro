/**
 * 📄 Descrição: Página de contas a pagar e a receber — transações pendentes
 * 🧱 Contexto: Módulo 3a — rota /movimentacoes/a-pagar
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/transactions, /api/transactions/[id], formatCurrency, formatDate
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, CircularProgress, Alert,
  IconButton, Tooltip, Stack, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Divider,
} from '@mui/material'
import {
  CheckCircle as ConfirmIcon,
  RadioButtonUnchecked as PendingIcon,
  Refresh as RefreshIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Warning as OverdueIcon,
} from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'AGENDADO' | 'CONFIRMADO' | 'CONCILIADO'
  due_date: string
  account_name?: string
  category_name?: string
}

function isOverdue(due_date: string) {
  return new Date(due_date) < new Date(new Date().toDateString())
}

export default function APagarPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [confirming, setConfirming]     = useState<string | null>(null)
  const [filterType, setFilterType]     = useState('')
  const [searchTerm, setSearchTerm]     = useState('')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ status: 'PENDENTE', limit: '100' })
      if (filterType) params.set('type', filterType)
      if (searchTerm) params.set('search', searchTerm)
      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : (data.data ?? []))
    } catch {
      setError('Erro ao carregar contas a pagar/receber.')
    } finally {
      setLoading(false)
    }
  }, [filterType, searchTerm])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMADO' }),
      })
      fetchTransactions()
    } finally {
      setConfirming(null)
    }
  }

  const totalPagar    = transactions.filter(t => t.type === 'DESPESA').reduce((s, t) => s + t.amount, 0)
  const totalReceber  = transactions.filter(t => t.type === 'RECEITA').reduce((s, t) => s + t.amount, 0)
  const totalVencidas = transactions.filter(t => isOverdue(t.due_date)).length

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>A Pagar / A Receber</Typography>
        <Tooltip title="Atualizar">
          <IconButton onClick={fetchTransactions} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>

      {/* Resumo */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          { label: 'A Receber', value: totalReceber, color: 'success.main', icon: <IncomeIcon /> },
          { label: 'A Pagar',   value: totalPagar,   color: 'error.main',   icon: <ExpenseIcon /> },
          { label: 'Vencidas',  value: totalVencidas, color: 'warning.main', icon: <OverdueIcon />, isCount: true },
        ].map(card => (
          <Paper key={card.label} sx={{ flex: 1, p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" color="text.secondary">{card.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={card.color}>
                  {card.isCount ? `${card.value} item(s)` : formatCurrency(card.value as number)}
                </Typography>
              </Box>
              <Box color={card.color}>{card.icon}</Box>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          size="small" placeholder="Buscar..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} label="Tipo">
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="RECEITA">A Receber</MenuItem>
            <MenuItem value="DESPESA">A Pagar</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhuma conta pendente encontrada.</Typography>
                  </TableCell>
                </TableRow>
              ) : transactions.map(tx => {
                const overdue = isOverdue(tx.due_date)
                return (
                  <TableRow key={tx.id} hover sx={overdue ? { bgcolor: 'error.50' } : {}}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {overdue && <OverdueIcon fontSize="small" color="warning" />}
                        <Typography variant="body2">{tx.description}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.category_name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.account_name ?? '—'}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', color: overdue ? 'error.main' : 'inherit', fontWeight: overdue ? 600 : 400 }}>
                      {formatDate(tx.due_date)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: tx.type === 'RECEITA' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {tx.type === 'RECEITA' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={tx.type === 'RECEITA' ? <IncomeIcon fontSize="small" /> : <ExpenseIcon fontSize="small" />}
                        label={tx.type === 'RECEITA' ? 'A Receber' : 'A Pagar'}
                        color={tx.type === 'RECEITA' ? 'success' : 'error'}
                        size="small" variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Confirmar pagamento">
                        <span>
                          <IconButton
                            size="small" color="success"
                            onClick={() => handleConfirm(tx.id)}
                            disabled={confirming === tx.id}
                          >
                            {confirming === tx.id
                              ? <CircularProgress size={16} />
                              : <ConfirmIcon fontSize="small" />
                            }
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
        <Divider />
        <Box px={2} py={1} display="flex" justifyContent="flex-end">
          <Typography variant="caption" color="text.secondary">
            {transactions.length} pendente(s)
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
