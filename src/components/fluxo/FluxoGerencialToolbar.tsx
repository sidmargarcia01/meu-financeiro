/**
 * 📄 Descrição: Toolbar da matriz de fluxo de caixa gerencial
 * 🧱 Contexto: Módulo Movimentações — página /movimentacoes/fluxo
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: Nenhuma
 * ✅ Revisado: Sim
 */

'use client'

import {
  Box,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material'
import { Refresh as RefreshIcon } from '@mui/icons-material'

function ultimoDiaDoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split('-').map(Number)
  const d = new Date(ano, mes, 0)
  return d.toISOString().split('T')[0]
}

interface FluxoGerencialToolbarProps {
  inicio: string
  fim: string
  regime: 'CAIXA' | 'COMPETENCIA'
  showChildren: boolean
  loading: boolean
  onInicioChange: (value: string) => void
  onFimChange: (value: string) => void
  onRegimeChange: (value: 'CAIXA' | 'COMPETENCIA') => void
  onToggleChildren: () => void
  onRefresh: () => void
}

export function FluxoGerencialToolbar(props: FluxoGerencialToolbarProps) {
  const {
    inicio, fim, regime, showChildren, loading,
    onInicioChange, onFimChange, onRegimeChange,
    onToggleChildren, onRefresh,
  } = props

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      alignItems={{ xs: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      mb={3}
    >
      <Box>
        <Typography variant="h5" fontWeight={700}>Fluxo de Caixa</Typography>
        <Typography variant="caption" color="text.secondary">
          Matriz gerencial mensal — REALIZADO / AV / AH
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
        <TextField
          label="Início"
          type="month"
          size="small"
          value={inicio.slice(0, 7)}
          onChange={(e) => onInicioChange(`${e.target.value}-01`)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Fim"
          type="month"
          size="small"
          value={fim.slice(0, 7)}
          onChange={(e) => onFimChange(ultimoDiaDoMes(e.target.value))}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Regime</InputLabel>
          <Select
            value={regime}
            onChange={(e) => onRegimeChange(e.target.value as 'CAIXA' | 'COMPETENCIA')}
            label="Regime"
          >
            <MenuItem value="CAIXA">Caixa</MenuItem>
            <MenuItem value="COMPETENCIA">Competência</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={<Switch checked={showChildren} onChange={onToggleChildren} size="small" />}
          label="Contas filhas"
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          disabled={loading}
        >
          Atualizar
        </Button>
      </Stack>
    </Stack>
  )
}
