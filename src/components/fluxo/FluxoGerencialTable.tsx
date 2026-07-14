/**
 * 📄 Descrição: Tabela matriz de fluxo de caixa gerencial (REALIZADO / AV / AH)
 * 🧱 Contexto: Módulo Movimentações — página /movimentacoes/fluxo
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: useFluxoGerencial, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'

import { useState } from 'react'
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material'
import { ChevronRight as ChevronRightIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'
import type { FluxoGerencialRelatorio, FluxoLinha, MesFluxo } from '@/services/fluxoGerencialService'
import { FluxoGerencialDrillDown } from './FluxoGerencialDrillDown'

interface FluxoGerencialTableProps {
  data: FluxoGerencialRelatorio
  showChildren: boolean
  inicio: string
  fim: string
  regime: 'CAIXA' | 'COMPETENCIA'
  onRefresh: () => void
}

const labelMes = (m: MesFluxo) => `${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][m.mes - 1]}/${String(m.ano).slice(-2)}`

function fmtPct(v: number | null): string {
  if (v === null || v === undefined) return '–'
  return `${v.toFixed(1)}%`
}

function corValor(valor: number, avTipo: FluxoLinha['avTipo']): string {
  if (valor === 0) return 'text.primary'
  if (avTipo === 'receita') return 'success.main'
  if (avTipo === 'deducao') return 'error.main'
  return valor > 0 ? 'success.main' : 'error.main'
}

function linhaTemDrillDown(id: string): boolean {
  if (id.startsWith('cat:') || id.startsWith('sub:')) return true
  const comDrill = [
    'receita_faturamento',
    'custos_variaveis',
    'despesas_fixas',
    'investimentos',
    'movimentacoes_nao_operacionais',
    'receitas_sem_categoria',
    'despesas_sem_categoria',
  ]
  return comDrill.includes(id)
}

export function FluxoGerencialTable({ data, showChildren, inicio, fim, regime, onRefresh }: FluxoGerencialTableProps) {
  const { meses, linhas } = data

  // Drill-down: linhas expandidas para edição de lançamentos
  const [expandedDrillDown, setExpandedDrillDown] = useState<Set<string>>(new Set())

  // Determina se uma linha deve ser visível
  const isVisible = (linha: FluxoLinha): boolean => {
    if (linha.nivel === 0) return true
    return showChildren
  }

  const toggleDrillDown = (id: string) => {
    setExpandedDrillDown(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Fundo alternado para linhas de resultado
  const bgRow = (linha: FluxoLinha): string | undefined => {
    if (linha.destaque) return 'grey.50'
    if (linha.id === 'resultado_liquido' || linha.id === 'saldo_final') return '#e3f2fd'
    return undefined
  }

  return (
    <Paper sx={{ overflow: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              rowSpan={2}
              sx={{
                position: 'sticky',
                left: 0,
                zIndex: 4,
                bgcolor: 'background.paper',
                minWidth: 320,
                fontWeight: 700,
                borderRight: 1,
                borderColor: 'divider',
              }}
            >
              DESCRIÇÃO
            </TableCell>
            {meses.map(m => (
              <TableCell
                key={`mes-${m.ano}-${m.mes}`}
                colSpan={3}
                align="center"
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  borderLeft: 1,
                  borderColor: 'primary.dark',
                }}
              >
                {labelMes(m).toUpperCase()}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            {meses.map(m => (
              <Box component="span" key={`sub-${m.ano}-${m.mes}`} sx={{ display: 'contents' }}>
                <TableCell
                  align="center"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                    borderLeft: 1,
                    borderColor: 'primary.dark',
                    minWidth: 110,
                  }}
                >
                  REALIZADO
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                    minWidth: 70,
                  }}
                >
                  AV
                </TableCell>
                <TableCell
                  align="center"
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    fontWeight: 600,
                    minWidth: 70,
                  }}
                >
                  AH
                </TableCell>
              </Box>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {linhas.filter(isVisible).map(linha => {
            const comDrillDown = linhaTemDrillDown(linha.id)
            const isDrillExpanded = expandedDrillDown.has(linha.id)

            return [
              <TableRow
                key={linha.id}
                sx={{
                  bgcolor: bgRow(linha),
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 3,
                    bgcolor: bgRow(linha) || 'background.paper',
                    borderRight: 1,
                    borderColor: 'divider',
                    pl: 1 + linha.nivel * 2,
                    fontWeight: linha.destaque ? 700 : 400,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 26 }} />
                    {comDrillDown && (
                      <IconButton
                        size="small"
                        onClick={() => toggleDrillDown(linha.id)}
                        sx={{ p: 0.3, color: 'primary.main', transform: isDrillExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                      >
                        <ChevronRightIcon fontSize="small" />
                      </IconButton>
                    )}
                    {!comDrillDown && <Box sx={{ width: 26 }} />}
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: linha.destaque ? 700 : 400,
                        textTransform: linha.tipo === 'calculado' ? 'uppercase' : 'none',
                      }}
                    >
                      {linha.label}
                    </Typography>
                  </Stack>
                </TableCell>

                {linha.valores.map((valor, idx) => (
                  <Box component="span" key={`${linha.id}-val-${idx}`} sx={{ display: 'contents' }}>
                    <TableCell
                      align="right"
                      sx={{
                        borderLeft: 1,
                        borderColor: 'divider',
                        fontWeight: linha.destaque ? 700 : 400,
                        color: corValor(valor.realizado, linha.avTipo),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Tooltip title={linha.label}>
                        <span>{formatCurrency(valor.realizado)}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: linha.destaque ? 700 : 400,
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtPct(valor.av)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: linha.destaque ? 700 : 400,
                        color: 'text.secondary',
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {fmtPct(valor.ah)}
                    </TableCell>
                  </Box>
                ))}
              </TableRow>,
              isDrillExpanded && comDrillDown && (
                <TableRow key={`${linha.id}-drill`} sx={{ bgcolor: 'grey.50' }}>
                  <TableCell
                    colSpan={1 + meses.length * 3}
                    sx={{ p: 0, borderBottom: 1, borderColor: 'divider' }}
                  >
                    <FluxoGerencialDrillDown
                      lineId={linha.id}
                      lineLabel={linha.label}
                      inicio={inicio}
                      fim={fim}
                      regime={regime}
                      onSaved={onRefresh}
                    />
                  </TableCell>
                </TableRow>
              ),
            ]
          })}
        </TableBody>
      </Table>
    </Paper>
  )
}
