/**
 * 📄 Descrição: CRUD de Categorias
 * 🧱 Contexto: Módulo 5 — rota /cadastros/categorias
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/categories, /api/categories/[id]
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Stack, CircularProgress, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface Category {
  id: string; name: string; type: 'RECEITA' | 'DESPESA'
  color?: string; isActive: boolean; parentId?: string; parent?: { name: string }
}

const EMPTY: Omit<Category, 'id' | 'isActive' | 'parent'> = { name: '', type: 'DESPESA', color: '#1976d2' }

export default function CategoriasPage() {
  const [items, setItems]       = useState<Category[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState<string | null>(null)
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/categories').then(r => r.json())
      setItems(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar categorias.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openNew  = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (c: Category) => { setForm({ name: c.name, type: c.type, color: c.color ?? '#1976d2' }); setEditId(c.id); setOpen(true) }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const method = editId ? 'PUT' : 'POST'
      const url    = editId ? `/api/categories/${editId}` : '/api/categories'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setOpen(false); load() }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Categorias</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>Nova Categoria</Button>
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
                <TableCell sx={{ fontWeight: 700 }}>Categoria Pai</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Nenhuma categoria cadastrada.</Typography>
                  <Button variant="text" size="small" onClick={openNew} sx={{ mt: 1 }}>Criar primeira categoria</Button>
                </TableCell></TableRow>
              ) : items.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {c.color && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c.color }} />}
                      <Typography variant="body2">{c.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip label={c.type} color={c.type === 'RECEITA' ? 'success' : 'error'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{c.parent?.name ?? '—'}</Typography></TableCell>
                  <TableCell>
                    <Chip label={c.isActive ? 'Ativa' : 'Inativa'} color={c.isActive ? 'default' : 'warning'} size="small" />
                  </TableCell>
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
        <DialogTitle>{editId ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Nome" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth size="small" required />
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} label="Tipo">
                <MenuItem value="RECEITA">Receita</MenuItem>
                <MenuItem value="DESPESA">Despesa</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Cor:</Typography>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }} />
            </Stack>
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
