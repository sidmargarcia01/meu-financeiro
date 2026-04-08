/**
 * 📄 Descrição: CRUD de Centros de Custo
 * 🧱 Contexto: Módulo 5 — rota /cadastros/centros
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/cost-centers, /api/cost-centers/[id]
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Stack, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Chip,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface CostCenter { id: string; name: string; code?: string; description?: string; isActive: boolean }

const EMPTY = { name: '', code: '', description: '' }

export default function CentrosPage() {
  const [items, setItems]     = useState<CostCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/cost-centers').then(r => r.json())
      setItems(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar centros de custo.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (c: CostCenter) => {
    setForm({ name: c.name, code: c.code ?? '', description: c.description ?? '' })
    setEditId(c.id); setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url    = editId ? `/api/cost-centers/${editId}` : '/api/cost-centers'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setOpen(false); load() }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este centro de custo?')) return
    await fetch(`/api/cost-centers/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Centros de Custo</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Novo Centro</Button>
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
                <TableCell sx={{ fontWeight: 700 }}>Código</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhum centro de custo cadastrado.</Typography>
                  <Button variant="text" size="small" onClick={openNew} sx={{ mt: 1 }}>Criar primeiro centro</Button>
                </TableCell></TableRow>
              ) : items.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{c.name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.code ?? '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.description ?? '—'}</Typography></TableCell>
                  <TableCell><Chip label={c.isActive ? 'Ativo' : 'Inativo'} color={c.isActive ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" required />
            <TextField label="Código" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} fullWidth size="small" />
            <TextField label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} />
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
