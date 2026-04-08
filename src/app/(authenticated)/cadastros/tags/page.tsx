/**
 * 📄 Descrição: CRUD de Tags
 * 🧱 Contexto: Módulo 5 — rota /cadastros/tags
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/tags, /api/tags/[id]
 * ✅ Revisado: Sim
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Button, IconButton, Tooltip, Stack,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip, Divider,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface Tag { id: string; name: string; color?: string }

const EMPTY = { name: '', color: '#1976d2' }

export default function TagsPage() {
  const [items, setItems]     = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetch('/api/tags').then(r => r.json())
      setItems(Array.isArray(data) ? data : [])
    } catch { setError('Erro ao carregar tags.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      if (res.ok) { setOpen(false); setForm(EMPTY); load() }
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta tag?')) return
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>Tags</Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Atualizar"><IconButton onClick={load} disabled={loading}><RefreshIcon /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY); setOpen(true) }}>Nova Tag</Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
        ) : items.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary" mb={2}>Nenhuma tag cadastrada.</Typography>
            <Button variant="text" size="small" onClick={() => setOpen(true)}>Criar primeira tag</Button>
          </Box>
        ) : (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {items.map(t => (
              <Chip
                key={t.id}
                label={t.name}
                onDelete={() => handleDelete(t.id)}
                deleteIcon={<DeleteIcon fontSize="small" />}
                sx={{
                  bgcolor: t.color ? `${t.color}20` : undefined,
                  borderColor: t.color,
                  border: '1px solid',
                  fontWeight: 500,
                  '& .MuiChip-label': { color: t.color ?? 'inherit' },
                }}
              />
            ))}
          </Stack>
        )}
        <Divider sx={{ mt: 3, mb: 1 }} />
        <Typography variant="caption" color="text.secondary">{items.length} tag(s) cadastrada(s)</Typography>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nova Tag</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Nome" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              fullWidth size="small" required
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">Cor:</Typography>
              <input
                type="color" value={form.color}
                onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
              />
              {form.name && (
                <Chip
                  label={form.name}
                  size="small"
                  sx={{ bgcolor: `${form.color}20`, border: `1px solid ${form.color}`, '& .MuiChip-label': { color: form.color } }}
                />
              )}
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
