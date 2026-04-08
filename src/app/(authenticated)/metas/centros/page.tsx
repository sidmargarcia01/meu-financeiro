/**
 * 📄 Descrição: Metas por Centro de Custo — orçamento vinculado a centros
 * 🧱 Contexto: Módulo 6 — rota /metas/centros
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/cost-centers, formatCurrency
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Stack, CircularProgress, Alert, LinearProgress, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface CostCenter { id: string; name: string }
interface MetaCentro {
  id: string; centroId: string; centroNome: string
  valorMeta: number; valorRealizado: number; mes: number; ano: number
}

const now = new Date()
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function MetasCentrosPage() {
  const [centros, setCentros]   = useState<CostCenter[]>([])
  const [metas, setMetas]       = useState<MetaCentro[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState({ centroId: '', valorMeta: 0, mes: now.getMonth() + 1, ano: now.getFullYear() })

  const loadCentros = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/cost-centers').then(r => r.json())
      setCentros(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar centros de custo.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCentros() }, [loadCentros])

  const handleSave = () => {
    if (!form.centroId || form.valorMeta <= 0) return
    const centro = centros.find(c => c.id === form.centroId)
    if (!centro) return
    setMetas(ms => [...ms, {
      id: crypto.randomUUID(),
      centroId: form.centroId,
      centroNome: centro.name,
      valorMeta: form.valorMeta,
      valorRealizado: 0,
      mes: form.mes,
      ano: form.ano,
    }])
    setOpen(false)
  }

  const handleDelete = (id: string) => setMetas(ms => ms.filter(m => m.id !== id))

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Metas por Centro de Custo</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Nova Meta</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Centro de Custo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Período</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Orçado</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Realizado</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Progresso</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {metas.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhuma meta definida.</Typography>
                  <Button variant="text" size="small" sx={{ mt: 1 }} onClick={() => setOpen(true)}>Criar primeira meta</Button>
                </TableCell></TableRow>
              ) : metas.map(m => {
                const pct = m.valorMeta > 0 ? (m.valorRealizado / m.valorMeta) * 100 : 0
                const cor = pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success'
                return (
                  <TableRow key={m.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={500}>{m.centroNome}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{MESES[m.mes - 1]}/{m.ano}</Typography></TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(m.valorMeta)}</TableCell>
                    <TableCell align="right" sx={{ color: cor === 'error' ? 'error.main' : 'text.primary' }}>{formatCurrency(m.valorRealizado)}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={cor}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                        <Chip label={`${pct.toFixed(0)}%`} size="small" color={cor} />
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(m.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Meta por Centro de Custo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <FormControl size="small" fullWidth>
              <InputLabel>Centro de Custo</InputLabel>
              <Select value={form.centroId} onChange={e => setForm(f => ({ ...f, centroId: e.target.value }))} label="Centro de Custo">
                {centros.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Orçamento" type="number" value={form.valorMeta}
              onChange={e => setForm(f => ({ ...f, valorMeta: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <Stack direction="row" spacing={1}>
              <FormControl size="small" sx={{ flex: 2 }}>
                <InputLabel>Mês</InputLabel>
                <Select value={form.mes} onChange={e => setForm(f => ({ ...f, mes: Number(e.target.value) }))} label="Mês">
                  {MESES.map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <InputLabel>Ano</InputLabel>
                <Select value={form.ano} onChange={e => setForm(f => ({ ...f, ano: Number(e.target.value) }))} label="Ano">
                  {[2024, 2025, 2026].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.centroId || form.valorMeta <= 0}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
