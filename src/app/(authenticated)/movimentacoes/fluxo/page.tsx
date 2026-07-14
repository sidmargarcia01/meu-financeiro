/**
 * 📄 Descrição: Página de Fluxo de Caixa com abas Matriz Gerencial e Gráfico
 * 🧱 Contexto: Módulo 3c — rota /movimentacoes/fluxo
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI, TanStack Query
 * 🔍 Dependências: /api/reports/fluxo-gerencial, /api/dashboard/fluxo-caixa, useFluxoGerencial, FluxoGerencialTable, FluxoGerencialToolbar
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Box, Typography, Paper, CircularProgress, Alert,
  IconButton, Tooltip, Stack, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  Tabs, Tab,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'
import { useFluxoGerencial } from '@/hooks/useFluxoGerencial'
import { FluxoGerencialToolbar } from '@/components/fluxo/FluxoGerencialToolbar'
import { FluxoGerencialTable } from '@/components/fluxo/FluxoGerencialTable'

const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface MesData {
  mes: number
  ano: number
  receitas: number
  despesas: number
  saldo: number
}

interface FluxoData { meses: MesData[] }

function BarGroup({ mes, receitas, despesas, saldo, maxVal }: {
  mes: string; receitas: number; despesas: number; saldo: number; maxVal: number
}) {
  const pct = (v: number) => maxVal > 0 ? Math.max((Math.abs(v) / maxVal) * 100, 2) : 2
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 56 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 100 }}>
        <Tooltip title={`Receitas: ${formatCurrency(receitas)}`}>
          <Box sx={{ width: 14, height: `${pct(receitas)}%`, bgcolor: 'success.main', borderRadius: '2px 2px 0 0', cursor: 'default' }} />
        </Tooltip>
        <Tooltip title={`Despesas: ${formatCurrency(despesas)}`}>
          <Box sx={{ width: 14, height: `${pct(despesas)}%`, bgcolor: 'error.main', borderRadius: '2px 2px 0 0', cursor: 'default' }} />
        </Tooltip>
        <Tooltip title={`Saldo: ${formatCurrency(saldo)}`}>
          <Box sx={{ width: 14, height: `${pct(saldo)}%`, bgcolor: saldo >= 0 ? 'primary.main' : 'warning.main', borderRadius: '2px 2px 0 0', cursor: 'default' }} />
        </Tooltip>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>{mes}</Typography>
    </Box>
  )
}

function GraficoFluxo() {
  const [data, setData] = useState<FluxoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meses, setMeses] = useState(6)

  const fetchFluxo = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dashboard/fluxo-caixa?meses=${meses}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setError('Erro ao carregar fluxo de caixa.')
    } finally {
      setLoading(false)
    }
  }, [meses])

  useEffect(() => { fetchFluxo() }, [fetchFluxo])

  const mesesData = data?.meses ?? []
  const totalRec = mesesData.reduce((s, m) => s + m.receitas, 0)
  const totalDesp = mesesData.reduce((s, m) => s + m.despesas, 0)
  const saldoFinal = totalRec - totalDesp
  const maxVal = Math.max(...mesesData.map(m => Math.max(m.receitas, m.despesas, Math.abs(m.saldo))), 1)

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={700}>Evolução Mensal</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select value={meses} onChange={e => setMeses(Number(e.target.value))} label="Período">
              <MenuItem value={3}>3 meses</MenuItem>
              <MenuItem value={6}>6 meses</MenuItem>
              <MenuItem value={12}>12 meses</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Atualizar">
            <IconButton onClick={fetchFluxo} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Cards resumo */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        {[
          { label: 'Total Receitas', value: totalRec, color: 'success.main' },
          { label: 'Total Despesas', value: totalDesp, color: 'error.main' },
          { label: 'Saldo Acumulado', value: saldoFinal, color: saldoFinal >= 0 ? 'primary.main' : 'warning.main' },
        ].map(c => (
          <Card key={c.label} sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">{c.label}</Typography>
              <Typography variant="h6" fontWeight={700} color={c.color}>{formatCurrency(c.value)}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={2}>Evolução Mensal</Typography>

            <Stack direction="row" spacing={3} mb={2}>
              {[
                { color: 'success.main', label: 'Receitas' },
                { color: 'error.main', label: 'Despesas' },
                { color: 'primary.main', label: 'Saldo' },
              ].map(l => (
                <Stack key={l.label} direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 10, height: 10, bgcolor: l.color, borderRadius: '2px' }} />
                  <Typography variant="caption">{l.label}</Typography>
                </Stack>
              ))}
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, overflowX: 'auto', pb: 1 }}>
              {mesesData.map(m => (
                <BarGroup
                  key={`${m.ano}-${m.mes}`}
                  mes={`${MES_LABELS[m.mes - 1]}/${String(m.ano).slice(-2)}`}
                  receitas={m.receitas}
                  despesas={m.despesas}
                  saldo={m.saldo}
                  maxVal={maxVal}
                />
              ))}
            </Box>
          </Paper>

          <Paper>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Mês/Ano</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Receitas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Despesas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Saldo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mesesData.map(m => (
                  <TableRow key={`${m.ano}-${m.mes}`} hover>
                    <TableCell>{MES_LABELS[m.mes - 1]}/{m.ano}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{formatCurrency(m.receitas)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{formatCurrency(m.despesas)}</TableCell>
                    <TableCell align="right" sx={{ color: m.saldo >= 0 ? 'primary.main' : 'warning.main', fontWeight: 700 }}>
                      {formatCurrency(m.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>{formatCurrency(totalRec)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>{formatCurrency(totalDesp)}</TableCell>
                  <TableCell align="right" sx={{ color: saldoFinal >= 0 ? 'primary.main' : 'warning.main', fontWeight: 700 }}>
                    {formatCurrency(saldoFinal)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Divider />
            <Box px={2} py={1}>
              <Typography variant="caption" color="text.secondary">
                Últimos {meses} meses
              </Typography>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  )
}

function defaultDates() {
  const now = new Date()
  const fim = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const inicio = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  return {
    inicio: inicio.toISOString().split('T')[0],
    fim: fim.toISOString().split('T')[0],
  }
}

export default function FluxoPage() {
  const defaults = useMemo(() => defaultDates(), [])
  const [inicio, setInicio] = useState(defaults.inicio)
  const [fim, setFim] = useState(defaults.fim)
  const [regime, setRegime] = useState<'CAIXA' | 'COMPETENCIA'>('CAIXA')
  const [showChildren, setShowChildren] = useState(false)
  const [aba, setAba] = useState<'matriz' | 'grafico'>('matriz')

  const { data, loading, error, refetch } = useFluxoGerencial({
    inicio,
    fim,
    regime,
    enabled: aba === 'matriz',
  })

  return (
    <Box sx={{ p: 3 }}>
      <FluxoGerencialToolbar
        inicio={inicio}
        fim={fim}
        regime={regime}
        showChildren={showChildren}
        loading={loading}
        onInicioChange={setInicio}
        onFimChange={setFim}
        onRegimeChange={setRegime}
        onToggleChildren={() => setShowChildren(v => !v)}
        onRefresh={refetch}
      />

      <Tabs
        value={aba}
        onChange={(_, v) => setAba(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="matriz" label="Matriz Gerencial" />
        <Tab value="grafico" label="Gráfico" />
      </Tabs>

      {aba === 'matriz' && (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {loading && (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}
          {!loading && data && (
            <FluxoGerencialTable
              data={data}
              showChildren={showChildren}
              inicio={inicio}
              fim={fim}
              regime={regime}
              onRefresh={refetch}
            />
          )}
          {!loading && !data && !error && (
            <Alert severity="info">Selecione um período para visualizar o fluxo de caixa.</Alert>
          )}
        </>
      )}

      {aba === 'grafico' && <GraficoFluxo />}
    </Box>
  )
}
