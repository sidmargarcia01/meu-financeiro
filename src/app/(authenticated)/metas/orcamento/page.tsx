/**
 * 📄 Descrição: Orçamento por Categoria — planejado vs realizado
 * 🧱 Contexto: Módulo 6 — rota /metas/orcamento
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/dashboard/categorias, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  CircularProgress, Alert, Stack, FormControl, InputLabel, Select, MenuItem,
  LinearProgress, Chip, IconButton, Tooltip,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface CatDistribuicao {
  categoryId: string
  categoryName: string
  total: number
  percentage: number
  transactionCount: number
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function OrcamentoPage() {
  const now = new Date()
  const [mes, setMes]           = useState(now.getMonth() + 1)
  const [ano, setAno]           = useState(now.getFullYear())
  const [data, setData]         = useState<CatDistribuicao[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/dashboard/categorias?mes=${mes}&ano=${ano}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(Array.isArray(json) ? json : (json.categorias ?? []))
    } catch { setError('Erro ao carregar distribuição por categoria.') }
    finally { setLoading(false) }
  }, [mes, ano])

  useEffect(() => { load() }, [load])

  const totalGasto = data.reduce((s, c) => s + c.total, 0)

  const pctColor = (pct: number) => pct >= 90 ? 'error' : pct >= 70 ? 'warning' : 'success'

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Orçamento por Categoria</Typography>
        <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
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
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Gasto</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">% Total</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Proporção</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Lançamentos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhuma despesa registrada neste período.</Typography>
                </TableCell></TableRow>
              ) : data.map(c => (
                <TableRow key={c.categoryId} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{c.categoryName}</Typography></TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{formatCurrency(c.total)}</TableCell>
                  <TableCell align="right">
                    <Chip label={`${c.percentage.toFixed(1)}%`} size="small"
                      color={pctColor(c.percentage)} variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <LinearProgress
                      variant="determinate" value={Math.min(c.percentage, 100)}
                      color={pctColor(c.percentage)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary">{c.transactionCount}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(totalGasto)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  )
}
