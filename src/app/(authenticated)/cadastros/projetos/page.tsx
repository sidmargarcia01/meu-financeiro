/**
 * 📄 Descrição: CRUD de Projetos
 * 🧱 Contexto: Módulo 5 — rota /cadastros/projetos
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/projects, /api/projects/[id]
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

interface Project {
  id: string; name: string; description?: string
  startDate?: string; endDate?: string; isActive: boolean
}

const EMPTY = { name: '', description: '', startDate: '', endDate: '' }

export default function ProjetosPage() {
  const [items, setItems]     = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState<string | null>(null)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/projects').then(r => r.json())
      setItems(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar projetos.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (p: Project) => {
    setForm({ name: p.name, description: p.description ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '' })
    setEditId(p.id); setOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url    = editId ? `/api/projects/${editId}` : '/api/projects'
      const payload = { ...form, startDate: form.startDate || undefined, endDate: form.endDate || undefined }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { setOpen(false); load() }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este projeto?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Projetos</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Novo Projeto</Button>
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
                <TableCell sx={{ fontWeight: 700 }}>Descrição</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Início</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Término</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhum projeto cadastrado.</Typography>
                  <Button variant="text" size="small" onClick={openNew} sx={{ mt: 1 }}>Criar primeiro projeto</Button>
                </TableCell></TableRow>
              ) : items.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell><Typography variant="body2" fontWeight={500}>{p.name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.description ?? '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.startDate ?? '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.endDate ?? '—'}</Typography></TableCell>
                  <TableCell><Chip label={p.isActive ? 'Ativo' : 'Inativo'} color={p.isActive ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(p)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => handleDelete(p.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editId ? 'Editar Projeto' : 'Novo Projeto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" required />
            <TextField label="Descrição" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} fullWidth size="small" multiline rows={2} />
            <TextField label="Data Início" type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="Data Término" type="date" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} fullWidth size="small" InputLabelProps={{ shrink: true }} />
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
