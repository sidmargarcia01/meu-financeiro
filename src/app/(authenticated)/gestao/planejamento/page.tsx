/**
 * 📄 Descrição: Planejamento Financeiro — cenários e projeções
 * 🧱 Contexto: Módulo 7 — rota /gestao/planejamento
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Stack, LinearProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Alert,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface Cenario {
  id: string; nome: string; descricao?: string
  receitas: number; despesas: number; metaEconomia: number
}

const EMPTY = { nome: '', descricao: '', receitas: 0, despesas: 0, metaEconomia: 0 }

export default function PlanejamentoPage() {
  const [cenarios, setCenarios] = useState<Cenario[]>([
    { id: '1', nome: 'Cenário Base', descricao: 'Projeção conservadora', receitas: 5000, despesas: 3200, metaEconomia: 1800 },
    { id: '2', nome: 'Cenário Otimista', descricao: 'Com aumento de receitas', receitas: 6500, despesas: 3500, metaEconomia: 3000 },
  ])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (c: Cenario) => {
    setForm({ nome: c.nome, descricao: c.descricao ?? '', receitas: c.receitas, despesas: c.despesas, metaEconomia: c.metaEconomia })
    setEditId(c.id); setOpen(true)
  }

  const handleSave = () => {
    if (!form.nome.trim()) return
    if (editId) {
      setCenarios(cs => cs.map(c => c.id === editId ? { ...c, ...form } : c))
    } else {
      setCenarios(cs => [...cs, { ...form, id: crypto.randomUUID() }])
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => setCenarios(cs => cs.filter(c => c.id !== id))

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Planejamento Financeiro</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Novo Cenário</Button>
      </Stack>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700 }}>Cenário</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Receitas</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Despesas</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Meta Economia</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">% Economia</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Progresso</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {cenarios.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">Nenhum cenário criado.</Typography>
                <Button variant="text" size="small" sx={{ mt: 1 }} onClick={openNew}>Criar primeiro cenário</Button>
              </TableCell></TableRow>
            ) : cenarios.map(c => {
              const pct = c.receitas > 0 ? (c.metaEconomia / c.receitas) * 100 : 0
              const cor = pct >= 30 ? 'success' : pct >= 15 ? 'warning' : 'error'
              return (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{c.nome}</Typography>
                      {c.descricao && <Typography variant="caption" color="text.secondary">{c.descricao}</Typography>}
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>{formatCurrency(c.receitas)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 600 }}>{formatCurrency(c.despesas)}</TableCell>
                  <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600 }}>{formatCurrency(c.metaEconomia)}</TableCell>
                  <TableCell align="right">
                    <Chip label={`${pct.toFixed(0)}%`} size="small" color={cor} />
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <LinearProgress variant="determinate" value={Math.min(pct, 100)} color={cor} sx={{ height: 8, borderRadius: 4 }} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar Cenário' : 'Novo Cenário'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} fullWidth size="small" required />
            <TextField label="Descrição" value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} fullWidth size="small" multiline rows={2} />
            <TextField label="Receitas Previstas" type="number" value={form.receitas} onChange={e => setForm(f => ({ ...f, receitas: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <TextField label="Despesas Previstas" type="number" value={form.despesas} onChange={e => setForm(f => ({ ...f, despesas: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <TextField label="Meta de Economia" type="number" value={form.metaEconomia} onChange={e => setForm(f => ({ ...f, metaEconomia: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.nome.trim()}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
