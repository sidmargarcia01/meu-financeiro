/**
 * 📄 Descrição: Página de transações pagas e recebidas (status CONFIRMADO / CONCILIADO)
 * 🧱 Contexto: Módulo 3b — rota /movimentacoes/pagas
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/transactions, formatCurrency, formatDate
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, CircularProgress, Alert,
  IconButton, Tooltip, Stack, TextField, FormControl,
  InputLabel, Select, MenuItem, Divider, Card, CardContent,
} from '@mui/material'
import {
  CheckCircle as ConfirmedIcon,
  Verified as ConciliatedIcon,
  Refresh as RefreshIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
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
  payment_date?: string
  account_name?: string
  category_name?: string
}

const STATUS_CFG = {
  CONFIRMADO: { label: 'Confirmado', color: 'success' as const, icon: <ConfirmedIcon fontSize="small" /> },
  CONCILIADO: { label: 'Conciliado', color: 'primary' as const, icon: <ConciliatedIcon fontSize="small" /> },
}

function getDefaultDates() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const fim    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { inicio, fim }
}

export default function PagasPage() {
  const { inicio: defInicio, fim: defFim } = getDefaultDates()
  const [transactions, setTransactions]   = useState<Transaction[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [filterType, setFilterType]       = useState('')
  const [searchTerm, setSearchTerm]       = useState('')
  const [inicio, setInicio]               = useState(defInicio)
  const [fim, setFim]                     = useState(defFim)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100', startDate: inicio, endDate: fim })
      if (filterType)   params.set('type', filterType)
      if (searchTerm)   params.set('search', searchTerm)

      // Buscar CONFIRMADO e CONCILIADO em paralelo
      const [resConf, resCon] = await Promise.all([
        fetch(`/api/transactions?${params}&status=CONFIRMADO`).then(r => r.json()),
        fetch(`/api/transactions?${params}&status=CONCILIADO`).then(r => r.json()),
      ])
      const conf = Array.isArray(resConf) ? resConf : (resConf.data ?? [])
      const con  = Array.isArray(resCon)  ? resCon  : (resCon.data ?? [])
      const all  = [...conf, ...con].sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      setTransactions(all)
    } catch {
      setError('Erro ao carregar transações pagas.')
    } finally {
      setLoading(false)
    }
  }, [filterType, searchTerm, inicio, fim])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const totalReceitas = transactions.filter(t => t.type === 'RECEITA').reduce((s, t) => s + t.amount, 0)
  const totalDespesas = transactions.filter(t => t.type === 'DESPESA').reduce((s, t) => s + t.amount, 0)
  const saldo         = totalReceitas - totalDespesas

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Pagas / Recebidas</Typography>
        <Tooltip title="Atualizar">
          <IconButton onClick={fetchTransactions} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Stack>

      {/* Resumo */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          { label: 'Receitas',  value: totalReceitas, color: 'success.main' },
          { label: 'Despesas',  value: totalDespesas, color: 'error.main' },
          { label: 'Saldo',     value: saldo,         color: saldo >= 0 ? 'success.main' : 'error.main' },
        ].map(c => (
          <Card key={c.label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h6" fontWeight={700} color={c.color}>{formatCurrency(c.value)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField
          size="small" placeholder="Buscar..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} sx={{ minWidth: 200 }}
        />
        <TextField label="De" type="date" size="small" value={inicio}
          onChange={e => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Até" type="date" size="small" value={fim}
          onChange={e => setFim(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={filterType} onChange={e => setFilterType(e.target.value)} label="Tipo">
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="RECEITA">Receita</MenuItem>
            <MenuItem value="DESPESA">Despesa</MenuItem>
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
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhuma transação encontrada no período.</Typography>
                  </TableCell>
                </TableRow>
              ) : transactions.map(tx => {
                const sCfg = STATUS_CFG[tx.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.CONFIRMADO
                return (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {tx.type === 'RECEITA'
                          ? <IncomeIcon fontSize="small" color="success" />
                          : <ExpenseIcon fontSize="small" color="error" />}
                        <Typography variant="body2">{tx.description}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.category_name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{tx.account_name ?? '—'}</Typography></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(tx.due_date)}</TableCell>
                    <TableCell align="right" sx={{ color: tx.type === 'RECEITA' ? 'success.main' : 'error.main', fontWeight: 600 }}>
                      {tx.type === 'RECEITA' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </TableCell>
                    <TableCell>
                      <Chip label={sCfg.label} color={sCfg.color} size="small" icon={sCfg.icon} variant="outlined" />
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
            {transactions.length} registro(s)
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}
