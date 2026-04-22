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
  dreGroup: string | null; total: number; percentual: number
  subcategorias: { id: string; nome: string; total: number }[]
}
interface DREEstruturado {
  receitasOperacionais: number
  impostosFaturamento: number
  receitaLiquida: number
  custosOperacionais: number
  margemBruta: number
  margemBrutaPercent: number | null
  despesasVariaveis: number
  margemContribuicao: number
  margemContribuicaoPercent: number | null
  despesasFixas: number
  ebitda: number
  ebitdaPercent: number | null
  receitasNaoOperacionais: number
  despesasNaoOperacionais: number
  resultadoAntesIR: number
  impostosLucro: number
  distribuicaoLucros: number
  resultadoLiquido: number
  margemLiquidaPercent: number | null
}
interface DREData {
  periodo: { inicio: string; fim: string }
  regime: string
  totalReceitas: number
  totalDespesas: number
  resultado: number
  estruturado: DREEstruturado
  categorias: DRECategoria[]
}

function getDefaultDates() {
  const now = new Date()
  return {
    inicio: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10),
    fim: now.toISOString().slice(0, 10),
  }
}

export default function DrePage() {
  const { inicio: defI, fim: defF } = getDefaultDates()
  const [data, setData] = useState<DREData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inicio, setInicio] = useState(defI)
  const [fim, setFim] = useState(defF)
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

  const fmtPct = (v: number | null) => v === null ? '–' : `${v.toFixed(1)}%`
  const e = data?.estruturado

  // Linhas do DRE gerencial em ordem
  const dreLinhas = e ? [
    { label: 'Receitas Operacionais (ROB)', valor: e.receitasOperacionais, pct: '100%', destaque: false, tipo: 'receita' },
    { label: '(-) Impostos sobre Faturamento', valor: -e.impostosFaturamento, pct: fmtPct(e.impostosFaturamento > 0 ? -(e.impostosFaturamento / e.receitasOperacionais) * 100 : null), destaque: false, tipo: 'deducao' },
    { label: 'Receita Líquida', valor: e.receitaLiquida, pct: fmtPct(e.receitasOperacionais > 0 ? (e.receitaLiquida / e.receitasOperacionais) * 100 : null), destaque: true, tipo: 'subtotal' },
    { label: '(-) Custos Operacionais (CPV/CSV)', valor: -e.custosOperacionais, pct: fmtPct(e.receitaLiquida > 0 ? -(e.custosOperacionais / e.receitaLiquida) * 100 : null), destaque: false, tipo: 'deducao' },
    { label: 'Margem Bruta', valor: e.margemBruta, pct: fmtPct(e.margemBrutaPercent), destaque: true, tipo: 'subtotal' },
    { label: '(-) Despesas Variáveis', valor: -e.despesasVariaveis, pct: fmtPct(e.receitaLiquida > 0 ? -(e.despesasVariaveis / e.receitaLiquida) * 100 : null), destaque: false, tipo: 'deducao' },
    { label: 'Margem de Contribuição', valor: e.margemContribuicao, pct: fmtPct(e.margemContribuicaoPercent), destaque: true, tipo: 'subtotal' },
    { label: '(-) Despesas Fixas', valor: -e.despesasFixas, pct: fmtPct(e.receitaLiquida > 0 ? -(e.despesasFixas / e.receitaLiquida) * 100 : null), destaque: false, tipo: 'deducao' },
    { label: 'EBITDA (Resultado Operacional)', valor: e.ebitda, pct: fmtPct(e.ebitdaPercent), destaque: true, tipo: 'subtotal' },
    { label: '(+) Receitas Não Operacionais', valor: e.receitasNaoOperacionais, pct: '', destaque: false, tipo: 'receita' },
    { label: '(-) Despesas Não Operacionais', valor: -e.despesasNaoOperacionais, pct: '', destaque: false, tipo: 'deducao' },
    { label: 'Resultado antes do IR (EBT)', valor: e.resultadoAntesIR, pct: '', destaque: true, tipo: 'subtotal' },
    { label: '(-) Impostos sobre Lucros', valor: -e.impostosLucro, pct: '', destaque: false, tipo: 'deducao' },
    { label: '(-) Distribuição de Lucros', valor: -e.distribuicaoLucros, pct: '', destaque: false, tipo: 'deducao' },
    { label: 'RESULTADO LÍQUIDO', valor: e.resultadoLiquido, pct: fmtPct(e.margemLiquidaPercent), destaque: true, tipo: 'total' },
  ] : []

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>DRE — Demonstrativo de Resultado</Typography>
          <Typography variant="caption" color="text.secondary">
            Estrutura gerencial com Margem Bruta, Margem de Contribuição e EBITDA
          </Typography>
        </Box>
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
      {e && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Receita Operacional Bruta', value: e.receitasOperacionais, color: 'success.main' },
            { label: 'Margem Bruta', value: e.margemBruta, color: e.margemBruta >= 0 ? 'primary.main' : 'error.main', extra: fmtPct(e.margemBrutaPercent) },
            { label: 'EBITDA', value: e.ebitda, color: e.ebitda >= 0 ? 'primary.main' : 'error.main', extra: fmtPct(e.ebitdaPercent) },
            { label: 'Resultado Líquido', value: e.resultadoLiquido, color: e.resultadoLiquido >= 0 ? 'primary.main' : 'warning.main', extra: fmtPct(e.margemLiquidaPercent) },
          ].map(c => (
            <Card key={c.label} sx={{ flex: 1 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700} color={c.color}>{formatCurrency(c.value)}</Typography>
                {'extra' in c && c.extra && <Chip label={c.extra} size="small" variant="outlined" sx={{ mt: 0.5 }} />}
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
                <TableCell sx={{ fontWeight: 700 }} align="right">% RL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dreLinhas.map((linha, i) => (
                <TableRow
                  key={i}
                  sx={{
                    bgcolor: linha.tipo === 'total'
                      ? (linha.valor >= 0 ? '#e3f2fd' : '#fff3e0')
                      : linha.destaque ? 'grey.100' : 'white',
                  }}
                >
                  <TableCell sx={{ fontWeight: linha.destaque ? 700 : 400, pl: linha.destaque ? 2 : 4 }}>
                    {linha.label}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: linha.destaque ? 700 : 400,
                      color: linha.tipo === 'total'
                        ? (linha.valor >= 0 ? 'primary.main' : 'warning.main')
                        : linha.tipo === 'receita' ? 'success.main'
                          : linha.tipo === 'deducao' ? 'error.main'
                            : 'text.primary',
                    }}
                  >
                    {formatCurrency(linha.valor)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                    {linha.pct}
                  </TableCell>
                </TableRow>
              ))}
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
