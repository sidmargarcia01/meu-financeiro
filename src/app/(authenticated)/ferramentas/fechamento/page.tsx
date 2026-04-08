/**
 * 📄 Descrição: Fechamento de Posição Financeira — resumo mensal
 * 🧱 Contexto: Módulo 8 — rota /ferramentas/fechamento
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/dashboard/resumo-mensal, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Stack, CircularProgress, Alert, Button,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
  Grid, Card, CardContent, LinearProgress, Chip, Divider,
} from '@mui/material'
import { Refresh as RefreshIcon, TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface ResumoMensal {
  revenues: number; expenses: number; balance: number
  revenuesPrev?: number; expensesPrev?: number; balancePrev?: number
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function FechamentoPage() {
  const now = new Date()
  const [mes, setMes]           = useState(now.getMonth() + 1)
  const [ano, setAno]           = useState(now.getFullYear())
  const [resumo, setResumo]     = useState<ResumoMensal>({ revenues: 0, expenses: 0, balance: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/resumo-mensal?mes=${mes}&ano=${ano}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResumo({
        revenues: data.revenues ?? 0,
        expenses: data.expenses ?? 0,
        balance: data.balance ?? 0,
        revenuesPrev: data.revenuesPrev,
        expensesPrev: data.expensesPrev,
        balancePrev: data.balancePrev,
      })
    } catch { setError('Erro ao carregar dados do fechamento.') }
    finally { setLoading(false) }
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const pctVariation = (current?: number, previous?: number) => {
    if (current == null || previous == null || previous === 0) return null
    return ((current - previous) / previous * 100)
  }

  const pctEconomia = resumo.revenues > 0 ? ((resumo.revenues - resumo.expenses) / resumo.revenues * 100) : 0

  const resumoCards = [
    {
      title: 'Receitas',
      value: formatCurrency(resumo.revenues),
      icon: <TrendingUp />,
      color: 'success.main',
      prev: resumo.revenuesPrev,
    },
    {
      title: 'Despesas',
      value: formatCurrency(resumo.expenses),
      icon: <TrendingDown />,
      color: 'error.main',
      prev: resumo.expensesPrev,
    },
    {
      title: 'Saldo',
      value: formatCurrency(resumo.balance),
      icon: resumo.balance >= 0 ? <AccountBalanceWallet /> : <TrendingDown />,
      color: resumo.balance >= 0 ? 'primary.main' : 'error.main',
      prev: resumo.balancePrev,
    },
    {
      title: '% Economia',
      value: `${pctEconomia.toFixed(1)}%`,
      icon: <AccountBalanceWallet />,
      color: pctEconomia >= 20 ? 'success.main' : pctEconomia >= 10 ? 'warning.main' : 'error.main',
    },
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Fechamento de Posição</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Mês</InputLabel>
            <Select value={mes} onChange={e => setMes(Number(e.target.value))} label="Mês">
              {MESES.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Ano</InputLabel>
            <Select value={ano} onChange={e => setAno(Number(e.target.value))} label="Ano">
              {[2023, 2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3}>
            {resumoCards.map((c, i) => {
              const pct = c.prev !== undefined ? pctVariation(c.value !== undefined ? (typeof c.value === 'string' ? 0 : (c.value as any)) : undefined, c.prev) : null
              return (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Card sx={{ height: '100%', border: '1px solid', borderColor: 'grey.200' }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Box color={c.color}>{c.icon}</Box>
                        {pct !== null && (
                          <Typography variant="caption" color={pct >= 0 ? 'success.main' : 'error.main'}>
                            {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                          </Typography>
                        )}
                      </Stack>
                      <Typography variant="h6" fontWeight={700} mb={0.5}>{c.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.title}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} mb={2}>Resumo do Fechamento</Typography>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Receitas</Typography>
                <Typography variant="body2" color="success.main" fontWeight={600}>{formatCurrency(resumo.revenues)}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Despesas</Typography>
                <Typography variant="body2" color="error.main" fontWeight={600}>{formatCurrency(resumo.expenses)}</Typography>
              </Stack>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight={600}>Saldo</Typography>
                <Typography variant="body2" fontWeight={700} color={resumo.balance >= 0 ? 'success.main' : 'error.main'}>
                  {formatCurrency(resumo.balance)}
                </Typography>
              </Stack>
            </Stack>
            <Box mt={3}>
              <Typography variant="body2" color="text.secondary" mb={1}>Taxa de Economia</Typography>
              <LinearProgress variant="determinate" value={Math.min(pctEconomia, 100)}
                color={pctEconomia >= 20 ? 'success' : pctEconomia >= 10 ? 'warning' : 'error'}
                sx={{ height: 10, borderRadius: 5 }} />
              <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                {pctEconomia.toFixed(1)}% das receitas economizadas
              </Typography>
            </Box>
          </Paper>

          <Stack direction="row" justifyContent="center">
            <Button variant="outlined" onClick={() => window.print()}>Imprimir Relatório</Button>
          </Stack>
        </Stack>
      )}
    </Box>
  )
}
