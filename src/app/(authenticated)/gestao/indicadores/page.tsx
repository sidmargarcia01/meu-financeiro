/**
 * 📄 Descrição: Painel de Indicadores Gerenciais — KPIs de Resultado, Estrutura e Caixa
 * 🧱 Contexto: Bloco 40 — rota /gestao/indicadores
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/reports/indicadores, formatCurrency
 * ✅ Revisado: Sim
 *
 * CAMADA: Page
 * MÓDULO: Gestão — Indicadores Gerenciais
 * RESPONSABILIDADE: Exibir KPIs consolidados por seção (Resultado, Estrutura, Caixa)
 * NÃO DEVE: Calcular indicadores — delegar ao backend
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Alert, Stack,
  Divider, Chip, TextField, IconButton, Tooltip,
} from '@mui/material'
import { Refresh as RefreshIcon, ChevronLeft, ChevronRight } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

// ─── Tipos locais (espelham IndicatorsReportResponse do service) ─────────────
type IndicatorUnit = 'R$' | '%' | 'ratio'

interface IndicatorDto {
  key: string
  label: string
  value: number | null
  unit: IndicatorUnit
}

interface IndicatorsSectionDto {
  title: string
  indicators: IndicatorDto[]
}

interface IndicatorsData {
  sections: IndicatorsSectionDto[]
  period: { startDate: string; endDate: string }
}

// ─── Helpers de período ───────────────────────────────────────────────────────
function periodoMensal(ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1).toISOString().slice(0, 10)
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10)
  return { inicio, fim }
}

// ─── Componente IndicatorCard ─────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  'Resultado': 'primary.main',
  'Estrutura e Solvência': 'warning.main',
  'Caixa': 'success.main',
}

function formatIndicatorValue(value: number | null, unit: IndicatorUnit): string {
  if (value === null) return 'N/A'
  if (unit === 'R$') return formatCurrency(value)
  if (unit === '%') return `${value.toFixed(1)}%`
  return value.toFixed(2)
}

function indicatorColor(value: number | null, unit: IndicatorUnit): string {
  if (value === null) return 'text.disabled'
  if (unit === 'R$') return value >= 0 ? 'success.main' : 'error.main'
  if (unit === '%') return value >= 0 ? 'success.main' : 'error.main'
  if (unit === 'ratio') return value >= 1 ? 'success.main' : 'warning.main'
  return 'text.primary'
}

interface IndicatorCardProps {
  indicator: IndicatorDto
  sectionColor: string
}

function IndicatorCard({ indicator, sectionColor }: IndicatorCardProps) {
  const formatted = formatIndicatorValue(indicator.value, indicator.unit)
  const color = indicator.value === null ? 'text.disabled' : indicatorColor(indicator.value, indicator.unit)

  return (
    <Card
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: 'grey.200',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 3 },
      }}
    >
      <CardContent>
        <Box
          sx={{
            width: 4, height: 32, borderRadius: 2,
            bgcolor: sectionColor, mb: 1.5,
          }}
        />
        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
          {indicator.label}
        </Typography>
        <Typography
          variant="h6"
          fontWeight={700}
          color={color}
          sx={{ fontSize: { xs: '1rem', md: '1.15rem' } }}
        >
          {formatted}
        </Typography>
        <Chip
          label={indicator.unit}
          size="small"
          variant="outlined"
          sx={{ mt: 1, fontSize: 10, height: 18 }}
        />
      </CardContent>
    </Card>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function IndicadoresPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [ano, setAno] = useState(now.getFullYear())
  const [data, setData] = useState<IndicatorsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIndicadores = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { inicio, fim } = periodoMensal(ano, mes)
      const params = new URLSearchParams({ inicio, fim })
      const res = await fetch(`/api/reports/indicadores?${params}`)
      if (!res.ok) throw new Error('Falha ao carregar indicadores')
      setData(await res.json())
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar indicadores.')
    } finally {
      setLoading(false)
    }
  }, [mes, ano])

  useEffect(() => { fetchIndicadores() }, [fetchIndicadores])

  function navMes(delta: number) {
    const d = new Date(ano, mes - 1 + delta, 1)
    setMes(d.getMonth() + 1)
    setAno(d.getFullYear())
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Indicadores do Negócio</Typography>
          <Typography variant="caption" color="text.secondary">
            KPIs consolidados de Resultado, Estrutura e Caixa
          </Typography>
        </Box>

        {/* Controle de período */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Mês anterior">
            <IconButton size="small" onClick={() => navMes(-1)}><ChevronLeft /></IconButton>
          </Tooltip>
          <TextField
            select
            size="small"
            value={mes}
            onChange={e => setMes(Number(e.target.value))}
            sx={{ minWidth: 130 }}
            SelectProps={{ native: true }}
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            sx={{ minWidth: 90 }}
            SelectProps={{ native: true }}
          >
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </TextField>
          <Tooltip title="Próximo mês">
            <IconButton size="small" onClick={() => navMes(1)}><ChevronRight /></IconButton>
          </Tooltip>
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={fetchIndicadores} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Período ativo */}
      {data && (
        <Typography variant="caption" color="text.secondary" display="block" mb={3}>
          Período analisado: {data.period.startDate} a {data.period.endDate}
        </Typography>
      )}

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : data && (
        <Stack spacing={4}>
          {data.sections.map(section => {
            const sectionColor = SECTION_COLORS[section.title] || 'primary.main'
            return (
              <Box key={section.title}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Box
                    sx={{
                      width: 12, height: 12, borderRadius: '50%',
                      bgcolor: sectionColor,
                    }}
                  />
                  <Typography variant="h6" fontWeight={700}>{section.title}</Typography>
                  <Divider sx={{ flex: 1 }} />
                </Stack>

                <Grid container spacing={2}>
                  {section.indicators.map(ind => (
                    <Grid key={ind.key} size={{ xs: 12, sm: 6, md: 3 }}>
                      <IndicatorCard indicator={ind} sectionColor={sectionColor} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )
          })}

          {/* Placeholder gráfico v2 */}
          <Box
            sx={{
              mt: 2, p: 3, border: '1px dashed', borderColor: 'grey.300',
              borderRadius: 2, textAlign: 'center',
            }}
          >
            <Typography variant="body2" color="text.disabled">
              📊 Em breve: evolução de Receita × Resultado ao longo dos meses
            </Typography>
          </Box>
        </Stack>
      )}
    </Box>
  )
}
