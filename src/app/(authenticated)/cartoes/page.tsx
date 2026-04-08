/**
 * 📄 Descrição: Cartões de Crédito — gestão de faturas e limites
 * 🧱 Contexto: Módulo 9 — rota /cartoes
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * ✅ Revisado: Sim
 */

'use client'

import { useState } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, Stack, LinearProgress, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, Alert,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface Cartao {
  id: string; nome: string; banco: string; limite: number; vencimento: number
  fechamento: number; faturaAtual: number; status: 'ATIVO' | 'INATIVO'
}

const EMPTY = { nome: '', banco: '', limite: 0, vencimento: 1, fechamento: 1, faturaAtual: 0, status: 'ATIVO' as 'ATIVO' | 'INATIVO' }

export default function CartoesPage() {
  const [cartoes, setCartoes] = useState<Cartao[]>([
    {
      id: '1',
      nome: 'NuBank',
      banco: 'NuBank',
      limite: 5000,
      vencimento: 10,
      fechamento: 5,
      faturaAtual: 2340,
      status: 'ATIVO',
    },
    {
      id: '2',
      nome: 'Inter Mastercard',
      banco: 'Banco Inter',
      limite: 3000,
      vencimento: 15,
      fechamento: 10,
      faturaAtual: 890,
      status: 'ATIVO',
    },
  ])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (c: Cartao) => {
    setForm({
      nome: c.nome,
      banco: c.banco,
      limite: c.limite,
      vencimento: c.vencimento,
      fechamento: c.fechamento,
      faturaAtual: c.faturaAtual,
      status: c.status,
    })
    setEditId(c.id); setOpen(true)
  }

  const handleSave = () => {
    if (!form.nome.trim()) return
    if (editId) {
      setCartoes(cs => cs.map(c => c.id === editId ? { ...c, ...form } : c))
    } else {
      setCartoes(cs => [...cs, { ...form, id: crypto.randomUUID() }])
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => setCartoes(cs => cs.filter(c => c.id !== id))

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Cartões de Crédito</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Novo Cartão</Button>
      </Stack>

      <Paper>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 700 }}>Cartão</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Banco</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Limite</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Fatura Atual</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">% Utilizado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Vencimento</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Fechamento</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {cartoes.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                <Typography color="text.secondary">Nenhum cartão cadastrado.</Typography>
                <Button variant="text" size="small" sx={{ mt: 1 }} onClick={openNew}>Adicionar primeiro cartão</Button>
              </TableCell></TableRow>
            ) : cartoes.map(c => {
              const pctUtilizado = c.limite > 0 ? (c.faturaAtual / c.limite) * 100 : 0
              const cor = pctUtilizado >= 80 ? 'error' : pctUtilizado >= 50 ? 'warning' : 'success'
              return (
                <TableRow key={c.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{c.nome}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.banco}</Typography></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(c.limite)}</TableCell>
                  <TableCell align="right" sx={{ color: cor === 'error' ? 'error.main' : 'text.primary' }}>
                    {formatCurrency(c.faturaAtual)}
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 180 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <LinearProgress variant="determinate" value={Math.min(pctUtilizado, 100)} color={cor}
                        sx={{ flex: 1, height: 8, borderRadius: 4 }} />
                      <Chip label={`${pctUtilizado.toFixed(0)}%`} size="small" color={cor} />
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2">{c.vencimento}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{c.fechamento}</Typography></TableCell>
                  <TableCell>
                    <Chip label={c.status} size="small" color={c.status === 'ATIVO' ? 'success' : 'default'} />
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
        <DialogTitle>{editId ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} fullWidth size="small" required />
            <TextField label="Banco" value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} fullWidth size="small" />
            <TextField label="Limite" type="number" value={form.limite} onChange={e => setForm(f => ({ ...f, limite: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <TextField label="Fatura Atual" type="number" value={form.faturaAtual} onChange={e => setForm(f => ({ ...f, faturaAtual: parseFloat(e.target.value) || 0 }))} fullWidth size="small" />
            <Stack direction="row" spacing={1}>
              <TextField label="Dia Vencimento" type="number" value={form.vencimento} onChange={e => setForm(f => ({ ...f, vencimento: parseInt(e.target.value) || 1 }))} size="small" />
              <TextField label="Dia Fechamento" type="number" value={form.fechamento} onChange={e => setForm(f => ({ ...f, fechamento: parseInt(e.target.value) || 1 }))} size="small" />
            </Stack>
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
