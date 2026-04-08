/**
 * 📄 Descrição: Página de Extrato Bancário — listagem de transações com saldos projetado e confirmado
 * 🧱 Contexto: Módulo 2 — rota /movimentacoes/extrato
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI, React Query
 * 🔍 Dependências: /api/reports/extrato, /api/accounts, formatCurrency, formatDate
 * ✅ Revisado: Sim
 *
 * CAMADA: Page
 * MÓDULO: Movimentacoes - Extrato
 * RESPONSABILIDADE: Exibir extrato bancário filtrado por conta e período
 * NÃO DEVE: Calcular saldos diretamente — delega ao reconciliationService via API
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, CircularProgress, Alert, FormControl, InputLabel,
  Select, MenuItem, TextField, Stack, Card, CardContent, Divider,
  IconButton, Tooltip,
} from '@mui/material'
import {
  CheckCircle as ConfirmedIcon,
  RadioButtonUnchecked as PendingIcon,
  Verified as ConciliatedIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface Account {
  id: string
  name: string
  type: string
}

interface Transaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO' | 'AGENDADO'
  due_date: string
  category?: { name: string }
}

interface ExtratoData {
  transactions: Transaction[]
  saldo_projetado: number
  saldo_confirmado: number
  account: Account
}

const STATUS_CONFIG = {
  PENDENTE:   { label: 'Pendente',   color: 'warning' as const, icon: <PendingIcon fontSize="small" /> },
  AGENDADO:   { label: 'Agendado',   color: 'info'    as const, icon: <PendingIcon fontSize="small" /> },
  CONFIRMADO: { label: 'Confirmado', color: 'success' as const, icon: <ConfirmedIcon fontSize="small" /> },
  CONCILIADO: { label: 'Conciliado', color: 'primary' as const, icon: <ConciliatedIcon fontSize="small" /> },
}

function getDefaultDates() {
  const now = new Date()
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const fim    = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { inicio, fim }
}

export default function ExtratoPage() {
  const { inicio: defaultInicio, fim: defaultFim } = getDefaultDates()

  const [accounts, setAccounts]         = useState<Account[]>([])
  const [accountId, setAccountId]       = useState('')
  const [inicio, setInicio]             = useState(defaultInicio)
  const [fim, setFim]                   = useState(defaultFim)
  const [extrato, setExtrato]           = useState<ExtratoData | null>(null)
  const [loading, setLoading]           = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.json())
      .then((data: Account[]) => {
        setAccounts(data)
        if (data.length > 0) setAccountId(data[0].id)
      })
      .catch(() => setError('Erro ao carregar contas'))
      .finally(() => setLoadingAccounts(false))
  }, [])

  const fetchExtrato = useCallback(async () => {
    if (!accountId) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ accountId, inicio, fim })
      const res = await fetch(`/api/reports/extrato?${params}`)
      if (!res.ok) throw new Error('Erro ao carregar extrato')
      const data: ExtratoData = await res.json()
      setExtrato(data)
    } catch {
      setError('Não foi possível carregar o extrato. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [accountId, inicio, fim])

  useEffect(() => {
    if (accountId) fetchExtrato()
  }, [accountId, fetchExtrato])

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>
          Extrato Bancário
        </Typography>
        <Tooltip title="Atualizar extrato">
          <IconButton onClick={fetchExtrato} disabled={loading || !accountId}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-end">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="conta-label">Conta</InputLabel>
            <Select
              labelId="conta-label"
              label="Conta"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              disabled={loadingAccounts}
            >
              {accounts.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Data inicial"
            type="date"
            size="small"
            value={inicio}
            onChange={e => setInicio(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="Data final"
            type="date"
            size="small"
            value={fim}
            onChange={e => setFim(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </Paper>

      {/* Cards de saldo */}
      {extrato && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Saldo Projetado
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={extrato.saldo_projetado >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(extrato.saldo_projetado)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Inclui pendentes + confirmados + conciliados
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Saldo Confirmado
              </Typography>
              <Typography
                variant="h6"
                fontWeight={700}
                color={extrato.saldo_confirmado >= 0 ? 'success.main' : 'error.main'}
              >
                {formatCurrency(extrato.saldo_confirmado)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Apenas confirmados e conciliados
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Lançamentos no período
              </Typography>
              <Typography variant="h6" fontWeight={700}>
                {extrato.transactions.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {extrato.account.name}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Feedback de estado */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Tabela de transações */}
      {!loading && extrato && (
        <Paper>
          {extrato.transactions.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">
                Nenhum lançamento encontrado para o período selecionado.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {extrato.transactions.map(tx => {
                  const isReceita = tx.type === 'RECEITA'
                  const statusCfg = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDENTE
                  return (
                    <TableRow key={tx.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {formatDate(tx.due_date)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {isReceita
                            ? <IncomeIcon fontSize="small" color="success" />
                            : <ExpenseIcon fontSize="small" color="error" />
                          }
                          <Typography variant="body2">{tx.description}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {tx.category?.name ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={statusCfg.icon}
                          label={statusCfg.label}
                          color={statusCfg.color}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={isReceita ? 'success.main' : 'error.main'}
                        >
                          {isReceita ? '+' : '-'}{formatCurrency(tx.amount)}
                        </Typography>
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
              {extrato.transactions.length} lançamento(s)
            </Typography>
          </Box>
        </Paper>
      )}

      {!loading && !extrato && !error && !loadingAccounts && accounts.length === 0 && (
        <Alert severity="info">
          Nenhuma conta cadastrada. Cadastre uma conta para visualizar o extrato.
        </Alert>
      )}
    </Box>
  )
}
