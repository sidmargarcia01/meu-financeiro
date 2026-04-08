/**
 * 📄 Descrição: Demonstrativo de Fluxo de Caixa (DFC)
 * 🧱 Contexto: Módulo 4 — rota /gestao/dfc
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/reports/dfc, formatCurrency, formatDate
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Alert, Stack,
  Card, CardContent, TextField, IconButton, Tooltip, Divider, Chip,
} from '@mui/material'
import { Refresh as RefreshIcon, TrendingUp as InIcon, TrendingDown as OutIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface DFCLinha {
  data: string; descricao: string; entrada: number; saida: number
  saldo: number; tipo: string; status: string; conta: string; categoria?: string
}
interface DFCData {
  periodo: { inicio: string; fim: string }
  linhas: DFCLinha[]
  totalEntradas: number; totalSaidas: number
  saldoFinal: number; saldoInicial: number
}

function getDefaultDates() {
  const now = new Date()
  return {
    inicio: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    fim:    new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  }
}

export default function DfcPage() {
  const { inicio: defI, fim: defF } = getDefaultDates()
  const [data, setData]       = useState<DFCData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [inicio, setInicio]   = useState(defI)
  const [fim, setFim]         = useState(defF)

  const fetchDFC = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ inicio, fim })
      const res = await fetch(`/api/reports/dfc?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError('Erro ao gerar DFC.') }
    finally { setLoading(false) }
  }, [inicio, fim])

  useEffect(() => { fetchDFC() }, [fetchDFC])

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>DFC — Fluxo de Caixa</Typography>
        <Tooltip title="Atualizar"><IconButton onClick={fetchDFC} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField label="Início" type="date" size="small" value={inicio}
          onChange={e => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Fim" type="date" size="small" value={fim}
          onChange={e => setFim(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Stack>

      {data && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Saldo Inicial',   value: data.saldoInicial,   color: 'text.primary' },
            { label: 'Total Entradas',  value: data.totalEntradas,  color: 'success.main' },
            { label: 'Total Saídas',    value: data.totalSaidas,    color: 'error.main' },
            { label: 'Saldo Final',     value: data.saldoFinal,     color: data.saldoFinal >= 0 ? 'primary.main' : 'warning.main' },
          ].map(c => (
            <Card key={c.label} sx={{ flex: 1 }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={c.color}>{formatCurrency(c.value)}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : data && (
        <Paper>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Conta</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Categoria</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Entrada</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Saída</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Saldo</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.linhas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">Nenhum lançamento no período.</Typography>
                  </TableCell>
                </TableRow>
              ) : data.linhas.map((l, i) => (
                <TableRow key={i} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(l.data)}</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {l.entrada > 0
                        ? <InIcon  fontSize="small" color="success" />
                        : <OutIcon fontSize="small" color="error" />}
                      <Typography variant="body2">{l.descricao}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{l.conta}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{l.categoria ?? '—'}</Typography></TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: l.entrada > 0 ? 600 : 400 }}>
                    {l.entrada > 0 ? formatCurrency(l.entrada) : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: l.saida > 0 ? 600 : 400 }}>
                    {l.saida > 0 ? formatCurrency(l.saida) : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: l.saldo >= 0 ? 'primary.main' : 'warning.main', fontWeight: 700 }}>
                    {formatCurrency(l.saldo)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={4} sx={{ fontWeight: 700 }}>Totais</TableCell>
                <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{formatCurrency(data.totalEntradas)}</TableCell>
                <TableCell align="right" sx={{ color: 'error.main',   fontWeight: 700 }}>{formatCurrency(data.totalSaidas)}</TableCell>
                <TableCell align="right" sx={{ color: data.saldoFinal >= 0 ? 'primary.main' : 'warning.main', fontWeight: 700 }}>
                  {formatCurrency(data.saldoFinal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Divider />
          <Box px={2} py={1}>
            <Typography variant="caption" color="text.secondary">
              Período: {data.periodo.inicio} a {data.periodo.fim}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
