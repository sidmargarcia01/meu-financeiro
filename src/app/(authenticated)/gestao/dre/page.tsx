/**
 * 📄 Descrição: Demonstrativo de Resultado do Exercício (DRE)
 * 🧱 Contexto: Módulo 4 — rota /gestao/dre
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/reports/dre, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, CircularProgress, Alert, Stack,
  Card, CardContent, FormControl, InputLabel, Select,
  MenuItem, TextField, Chip, IconButton, Tooltip, Divider,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface DRECategoria {
  id: string; nome: string; tipo: 'RECEITA' | 'DESPESA'
  total: number; percentual: number
  subcategorias: { id: string; nome: string; total: number }[]
}
interface DREData {
  periodo: { inicio: string; fim: string }
  regime: string
  totalReceitas: number
  totalDespesas: number
  resultado: number
  categorias: DRECategoria[]
}

function getDefaultDates() {
  const now = new Date()
  return {
    inicio: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
    fim:    now.toISOString().slice(0, 10),
  }
}

export default function DrePage() {
  const { inicio: defI, fim: defF } = getDefaultDates()
  const [data, setData]     = useState<DREData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)
  const [inicio, setInicio] = useState(defI)
  const [fim, setFim]       = useState(defF)
  const [regime, setRegime] = useState('CAIXA')

  const fetchDRE = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ inicio, fim, regime })
      const res = await fetch(`/api/reports/dre?${params}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError('Erro ao gerar DRE.') }
    finally { setLoading(false) }
  }, [inicio, fim, regime])

  useEffect(() => { fetchDRE() }, [fetchDRE])

  const receitas = data?.categorias.filter(c => c.tipo === 'RECEITA') ?? []
  const despesas = data?.categorias.filter(c => c.tipo === 'DESPESA') ?? []

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>DRE — Demonstrativo de Resultado</Typography>
        <Tooltip title="Atualizar"><IconButton onClick={fetchDRE} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
      </Stack>

      {/* Filtros */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
        <TextField label="Início" type="date" size="small" value={inicio}
          onChange={e => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField label="Fim" type="date" size="small" value={fim}
          onChange={e => setFim(e.target.value)} InputLabelProps={{ shrink: true }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Regime</InputLabel>
          <Select value={regime} onChange={e => setRegime(e.target.value)} label="Regime">
            <MenuItem value="CAIXA">Caixa</MenuItem>
            <MenuItem value="COMPETENCIA">Competência</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Cards resumo */}
      {data && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Receitas Totais',  value: data.totalReceitas, color: 'success.main' },
            { label: 'Despesas Totais',  value: data.totalDespesas, color: 'error.main' },
            { label: 'Resultado Líquido', value: data.resultado,    color: data.resultado >= 0 ? 'primary.main' : 'warning.main' },
          ].map(c => (
            <Card key={c.label} sx={{ flex: 1 }}>
              <CardContent>
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
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Valor</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">% Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* RECEITAS */}
              <TableRow sx={{ bgcolor: 'success.50' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 700, color: 'success.dark' }}>RECEITAS</TableCell>
              </TableRow>
              {receitas.map(cat => (
                <>
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ pl: 3 }}>{cat.nome}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{formatCurrency(cat.total)}</TableCell>
                    <TableCell align="right">{cat.percentual.toFixed(1)}%</TableCell>
                  </TableRow>
                  {cat.subcategorias.map(s => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ pl: 6, color: 'text.secondary' }}>{s.nome}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(s.total)}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </>
              ))}
              <TableRow sx={{ bgcolor: 'success.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total Receitas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{formatCurrency(data.totalReceitas)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>

              {/* DESPESAS */}
              <TableRow sx={{ bgcolor: 'error.50' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 700, color: 'error.dark' }}>DESPESAS</TableCell>
              </TableRow>
              {despesas.map(cat => (
                <>
                  <TableRow key={cat.id} hover>
                    <TableCell sx={{ pl: 3 }}>{cat.nome}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{formatCurrency(cat.total)}</TableCell>
                    <TableCell align="right">{cat.percentual.toFixed(1)}%</TableCell>
                  </TableRow>
                  {cat.subcategorias.map(s => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ pl: 6, color: 'text.secondary' }}>{s.nome}</TableCell>
                      <TableCell align="right" sx={{ color: 'text.secondary' }}>{formatCurrency(s.total)}</TableCell>
                      <TableCell />
                    </TableRow>
                  ))}
                </>
              ))}
              <TableRow sx={{ bgcolor: 'error.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total Despesas</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>{formatCurrency(data.totalDespesas)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>

              {/* RESULTADO */}
              <TableRow sx={{ bgcolor: data.resultado >= 0 ? 'primary.50' : 'warning.50' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '1rem' }}>RESULTADO LÍQUIDO</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '1rem', color: data.resultado >= 0 ? 'primary.main' : 'warning.main' }}>
                  {formatCurrency(data.resultado)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
          <Divider />
          <Box px={2} py={1}>
            <Typography variant="caption" color="text.secondary">
              Período: {data.periodo.inicio} a {data.periodo.fim} | Regime: {data.regime}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
}
