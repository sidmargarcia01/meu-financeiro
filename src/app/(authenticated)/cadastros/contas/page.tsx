/**
 * 📄 Descrição: CRUD de Contas Bancárias
 * 🧱 Contexto: Módulo 5 — rota /cadastros/contas
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/accounts, /api/accounts/[id]
 * ✅ Revisado: Sim
 */

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Stack, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

const ACCOUNT_TYPES = [
  { value: 'CORRENTE', label: 'Conta Corrente' },
  { value: 'POUPANCA', label: 'Poupança' },
  { value: 'CARTEIRA', label: 'Carteira' },
  { value: 'INVESTIMENTO', label: 'Investimento' },
  { value: 'CARTAO', label: 'Cartão' },
]

interface Account {
  id: string; name: string; type: string; bank?: string
  initialBalance: number; confirmedBalance?: number; projectedBalance?: number
  currency: string; isActive: boolean
}

const EMPTY = { name: '', type: 'CORRENTE', bank: '', currency: 'BRL', initialBalance: 0 }

export default function ContasPage() {
  const [items, setItems] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/accounts?balances=true').then(r => r.json())
      setItems(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar contas.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (a: Account) => {
    setForm({ name: a.name, type: a.type, bank: a.bank ?? '', currency: a.currency, initialBalance: a.initialBalance ?? 0 })
    setEditId(a.id); setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url = editId ? `/api/accounts/${editId}` : '/api/accounts'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, initialBalance: Number(form.initialBalance) }) })
      if (res.ok) { setOpen(false); load() }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta?')) return
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    load()
  }

  const typeLabel = (t: string) => ACCOUNT_TYPES.find(x => x.value === t)?.label ?? t

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Contas</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Nova Conta</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper>
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Banco</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Saldo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhuma conta cadastrada.</Typography>
                  <Button variant="text" size="small" onClick={openNew} sx={{ mt: 1 }}>Criar primeira conta</Button>
                </TableCell></TableRow>
              ) : items.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{a.name}</Typography></TableCell>
                  <TableCell><Chip label={typeLabel(a.type)} size="small" variant="outlined" /></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{a.bank ?? '—'}</Typography></TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, color: (a.confirmedBalance ?? a.initialBalance ?? 0) < 0 ? 'error.main' : 'inherit' }}>{formatCurrency(a.confirmedBalance ?? a.initialBalance ?? 0)}</TableCell>
                  <TableCell><Chip label={a.isActive ? 'Ativa' : 'Inativa'} color={a.isActive ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" required />
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} label="Tipo">
                {ACCOUNT_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Banco" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} fullWidth size="small" />
            <TextField label="Saldo Inicial" type="number" inputProps={{ step: '0.01' }} value={form.initialBalance}
              onChange={e => setForm(f => ({ ...f, initialBalance: parseFloat(e.target.value) || 0 }))} fullWidth size="small"
              helperText="Valor de abertura da conta (ex: saldo atual do banco)" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
