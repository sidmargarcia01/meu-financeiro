/**
 * 📄 Descrição: Metas de Economia — criar e acompanhar metas de poupança
 * 🧱 Contexto: Módulo 6 — rota /metas/economia
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI (estado local)
 * ✅ Revisado: Sim
 */

'use client'

import { useState } from 'react'
import {
  Box, Typography, Paper, Button, Stack, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, Chip, Alert, Card, CardContent,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface Meta {
  id: string; nome: string; valorMeta: number
  valorAtual: number; prazo: string; descricao?: string
}

const EMPTY = { nome: '', valorMeta: 0, valorAtual: 0, prazo: '', descricao: '' }

export default function MetasEconomiaPage() {
  const [metas, setMetas]       = useState<Meta[]>([])
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState<string | null>(null)
  const [aportOpen, setAportOpen] = useState(false)
  const [aporteMeta, setAporteMeta] = useState<string | null>(null)
  const [aporteValor, setAporteValor] = useState(0)

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (m: Meta) => {
    setForm({ nome: m.nome, valorMeta: m.valorMeta, valorAtual: m.valorAtual, prazo: m.prazo, descricao: m.descricao ?? '' })
    setEditId(m.id); setOpen(true)
  }

  const handleSave = () => {
    if (!form.nome.trim() || form.valorMeta <= 0) return
    if (editId) {
      setMetas(ms => ms.map(m => m.id === editId ? { ...m, ...form } : m))
    } else {
      setMetas(ms => [...ms, { ...form, id: crypto.randomUUID() }])
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => setMetas(ms => ms.filter(m => m.id !== id))

  const handleAporte = () => {
    if (!aporteMeta || aporteValor <= 0) return
    setMetas(ms => ms.map(m => m.id === aporteMeta ? { ...m, valorAtual: Math.min(m.valorAtual + aporteValor, m.valorMeta) } : m))
    setAportOpen(false); setAporteValor(0)
  }

  const totalMetas   = metas.reduce((s, m) => s + m.valorMeta, 0)
  const totalAtual   = metas.reduce((s, m) => s + m.valorAtual, 0)

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Metas de Economia</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Nova Meta</Button>
      </Stack>

      {metas.length > 0 && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
          {[
            { label: 'Total de Metas',  value: formatCurrency(totalMetas) },
            { label: 'Valor Acumulado', value: formatCurrency(totalAtual) },
            { label: 'Progresso Geral', value: `${totalMetas > 0 ? ((totalAtual / totalMetas) * 100).toFixed(1) : 0}%` },
          ].map(c => (
            <Card key={c.label} sx={{ flex: 1 }}>
              <CardContent sx={{ py: '12px !important' }}>
                <Typography variant="caption" color="text.secondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight={700}>{c.value}</Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {metas.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography color="text.secondary" mb={2}>Nenhuma meta cadastrada.</Typography>
          <Button variant="outlined" onClick={openNew}>Criar primeira meta</Button>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {metas.map(m => {
            const pct   = m.valorMeta > 0 ? (m.valorAtual / m.valorMeta) * 100 : 0
            const cor   = pct >= 100 ? 'success' : pct >= 50 ? 'primary' : 'warning'
            return (
              <Paper key={m.id} sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Box>
                    <Typography fontWeight={700}>{m.nome}</Typography>
                    {m.descricao && <Typography variant="caption" color="text.secondary">{m.descricao}</Typography>}
                  </Box>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Registrar aporte">
                      <Button size="small" variant="outlined" color="success"
                        onClick={() => { setAporteMeta(m.id); setAporteValor(0); setAportOpen(true) }}
                      >+ Aporte</Button>
                    </Tooltip>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(m)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(m.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(m.valorAtual)} / {formatCurrency(m.valorMeta)}
                  </Typography>
                  <Chip label={pct >= 100 ? 'Concluída!' : `${pct.toFixed(1)}%`}
                    color={cor} size="small" />
                  {m.prazo && <Typography variant="caption" color="text.secondary">Prazo: {m.prazo}</Typography>}
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={cor} sx={{ height: 10, borderRadius: 5 }} />
              </Paper>
            )
          })}
        </Stack>
      )}

      {/* Dialog nova/editar meta */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar Meta' : 'Nova Meta de Economia'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} fullWidth size="small" required />
            <TextField label="Valor da Meta" type="number" value={form.valorMeta}
              onChange={e => setForm(f => ({ ...f, valorMeta: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <TextField label="Valor Atual" type="number" value={form.valorAtual}
              onChange={e => setForm(f => ({ ...f, valorAtual: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <TextField label="Prazo" type="date" value={form.prazo}
              onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Descrição" value={form.descricao}
              onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} fullWidth size="small" multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nome.trim() || form.valorMeta <= 0}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog aporte */}
      <Dialog open={aportOpen} onClose={() => setAportOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Registrar Aporte</DialogTitle>
        <DialogContent>
          <TextField label="Valor do Aporte" type="number" value={aporteValor}
            onChange={e => setAporteValor(parseFloat(e.target.value) || 0)}
            fullWidth size="small" sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAportOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAporte} disabled={aporteValor <= 0}>Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
