/**
 * 📄 Descrição: Indicadores Financeiros — KPIs de saúde financeira
 * 🧱 Contexto: Módulo 7 — rota /gestao/indicadores
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/dashboard/saldo, /api/dashboard/resumo-mensal, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Stack,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material'
import { Refresh as RefreshIcon, TrendingUp, TrendingDown, AccountBalanceWallet, Savings } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface SaldoConsolidado { projected: number; confirmed: number }
interface ResumoMensal {
  revenues: number; expenses: number; balance: number
  revenuesPrev?: number; expensesPrev?: number; balancePrev?: number
}

export default function IndicadoresPage() {
  const now = new Date()
  const [mes, setMes]           = useState(now.getMonth() + 1)
  const [ano, setAno]           = useState(now.getFullYear())
  const [saldo, setSaldo]       = useState<SaldoConsolidado>({ projected: 0, confirmed: 0 })
  const [resumo, setResumo]     = useState<ResumoMensal>({ revenues: 0, expenses: 0, balance: 0 })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [sRes, rRes] = await Promise.all([
        fetch('/api/dashboard/saldo'),
        fetch(`/api/dashboard/resumo-mensal?mes=${mes}&ano=${ano}`),
      ])
      if (!sRes.ok || !rRes.ok) throw new Error()
      const s = await sRes.json()
      const r = await rRes.json()
      setSaldo({ projected: s.projected ?? 0, confirmed: s.confirmed ?? 0 })
      setResumo({
        revenues: r.revenues ?? 0,
        expenses: r.expenses ?? 0,
        balance: r.balance ?? 0,
        revenuesPrev: r.revenuesPrev,
        expensesPrev: r.expensesPrev,
        balancePrev: r.balancePrev,
      })
    } catch { setError('Erro ao carregar indicadores.') }
    finally { setLoading(false) }
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

  const kpis = [
    {
      title: 'Saldo Projetado',
      value: formatCurrency(saldo.projected),
      icon: <AccountBalanceWallet />,
      color: 'primary.main',
    },
    {
      title: 'Saldo Confirmado',
      value: formatCurrency(saldo.confirmed),
      icon: <Savings />,
      color: 'success.main',
    },
    {
      title: 'Receitas do Mês',
      value: formatCurrency(resumo.revenues),
      icon: <TrendingUp />,
      color: 'success.main',
      prev: resumo.revenuesPrev,
    },
    {
      title: 'Despesas do Mês',
      value: formatCurrency(resumo.expenses),
      icon: <TrendingDown />,
      color: 'error.main',
      prev: resumo.expensesPrev,
    },
    {
      title: 'Saldo do Mês',
      value: formatCurrency(resumo.balance),
      icon: resumo.balance >= 0 ? <TrendingUp /> : <TrendingDown />,
      color: resumo.balance >= 0 ? 'success.main' : 'error.main',
      prev: resumo.balancePrev,
    },
    {
      title: 'Economia Mensal',
      value: `${resumo.revenues > 0 ? ((resumo.revenues - resumo.expenses) / resumo.revenues * 100).toFixed(1) : 0}%`,
      icon: <Savings />,
      color: resumo.revenues > resumo.expenses ? 'success.main' : 'warning.main',
    },
  ]

  const pctVariation = (current?: number, previous?: number) => {
    if (current == null || previous == null || previous === 0) return null
    return ((current - previous) / previous * 100)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Indicadores Financeiros</Typography>
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
        <Grid container spacing={3}>
          {kpis.map((k, i) => {
            const pct = k.prev !== undefined ? pctVariation(k.value !== undefined ? (typeof k.value === 'string' ? 0 : (k.value as any)) : undefined, k.prev) : null
            return (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{ height: '100%', border: '1px solid', borderColor: 'grey.200' }}>
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box color={k.color}>{k.icon}</Box>
                      {pct !== null && (
                        <Typography variant="caption" color={pct >= 0 ? 'success.main' : 'error.main'}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="h6" fontWeight={700} mb={0.5}>{k.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{k.title}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}
