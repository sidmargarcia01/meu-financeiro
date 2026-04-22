/**
 * 📄 Descrição: Página de Categorias com suporte a dreGroup para DRE gerencial
 * 🧱 Contexto: Cadastros — rota /cadastros/categorias
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/categories, /api/categories/importar-padrao
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
    Box, Typography, Stack, Button, IconButton, Tooltip, Alert, Chip,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Paper, Table, TableHead, TableRow, TableCell,
    TableBody, Divider,
} from '@mui/material'
import {
    Add as AddIcon, Delete as DeleteIcon,
    Edit as EditIcon, Refresh as RefreshIcon,
    Download as ImportIcon,
} from '@mui/icons-material'
import { DRE_GROUPS, DRE_GROUP_LABELS, type DreGroup } from '@/schemas/categorySchema'

interface Category {
    id: string
    name: string
    type: 'RECEITA' | 'DESPESA'
    parent_id: string | null
    dre_group: DreGroup | null
    children?: Category[]
}

// ─── Cores por dreGroup ───────────────────────────────────────────────────────
const DRE_GROUP_COLOR: Record<DreGroup, 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'> = {
    RECEITAS_OPERACIONAIS: 'success',
    IMPOSTOS_FATURAMENTO: 'warning',
    CUSTOS_OPERACIONAIS: 'error',
    DESPESAS_VARIAVEIS: 'info',
    DESPESAS_FIXAS: 'secondary',
    RECEITAS_NAO_OPERACIONAIS: 'primary',
    DESPESAS_NAO_OPERACIONAIS: 'default',
    IMPOSTOS_LUCRO: 'error',
    DISTRIBUICAO_LUCROS: 'default',
}

const EMPTY_FORM = { name: '', type: 'DESPESA' as 'RECEITA' | 'DESPESA', dre_group: '' as DreGroup | '' }

export default function CategoriasPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Dialog criar
    const [openCreate, setOpenCreate] = useState(false)
    const [form, setForm] = useState({ ...EMPTY_FORM })
    const [saving, setSaving] = useState(false)

    // Dialog editar dreGroup
    const [editTarget, setEditTarget] = useState<Category | null>(null)
    const [editGroup, setEditGroup] = useState<DreGroup | ''>('')

    const fetchCategories = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('Erro ao buscar categorias')
            setCategories(await res.json())
        } catch (err: any) {
            setError(err.message)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchCategories() }, [fetchCategories])

    const handleCreate = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            const body: any = { name: form.name.trim(), type: form.type }
            if (form.dre_group) body.dre_group = form.dre_group
            const res = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setOpenCreate(false)
            setForm({ ...EMPTY_FORM })
            setSuccess('Categoria criada com sucesso!')
            fetchCategories()
        } catch (err: any) {
            setError(err.message)
        } finally { setSaving(false) }
    }

    const handleSaveDreGroup = async () => {
        if (!editTarget) return
        setSaving(true)
        try {
            const res = await fetch(`/api/categories/${editTarget.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dre_group: editGroup || null }),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setEditTarget(null)
            setSuccess('Grupo DRE atualizado!')
            fetchCategories()
        } catch (err: any) {
            setError(err.message)
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Excluir "${name}"?`)) return
        try {
            const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setSuccess('Categoria excluída.')
            fetchCategories()
        } catch (err: any) { setError(err.message) }
    }

    const handleImportarPadrao = async () => {
        setImporting(true); setError(null)
        try {
            const res = await fetch('/api/categories/importar-padrao', { method: 'POST' })
            if (!res.ok) throw new Error('Erro ao importar')
            const { criadas, ignoradas } = await res.json()
            setSuccess(`${criadas} categorias criadas, ${ignoradas} já existentes ignoradas.`)
            fetchCategories()
        } catch (err: any) {
            setError(err.message)
        } finally { setImporting(false) }
    }

    // Flat list (raízes + filhos juntos para exibir)
    const allFlat = categories.flatMap(c => [c, ...(c.children ?? [])])

    return (
        <Box sx={{ p: 3 }}>
            {/* Cabeçalho */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Categorias</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Configure o Grupo DRE para habilitar Margem Bruta, EBITDA e Margem Líquida
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Tooltip title="Importar modelo padrão (16 categorias pré-configuradas com Grupo DRE)">
                        <Button
                            variant="outlined"
                            startIcon={importing ? <CircularProgress size={16} /> : <ImportIcon />}
                            onClick={handleImportarPadrao}
                            disabled={importing}
                            size="small"
                        >
                            Importar Padrão DRE
                        </Button>
                    </Tooltip>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenCreate(true)} size="small">
                        Nova Categoria
                    </Button>
                    <Tooltip title="Atualizar">
                        <IconButton size="small" onClick={fetchCategories} disabled={loading}><RefreshIcon /></IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {loading ? (
                <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
            ) : (
                <Paper>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Grupo DRE</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {allFlat.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                        Nenhuma categoria cadastrada. Clique em "Importar Padrão DRE" para começar.
                                    </TableCell>
                                </TableRow>
                            ) : allFlat.map(cat => (
                                <TableRow
                                    key={cat.id}
                                    hover
                                    sx={{ bgcolor: cat.parent_id ? 'grey.50' : 'white' }}
                                >
                                    <TableCell sx={{ pl: cat.parent_id ? 4 : 2 }}>
                                        {cat.parent_id && <Typography component="span" color="text.disabled" mr={1}>↳</Typography>}
                                        {cat.name}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={cat.type}
                                            size="small"
                                            color={cat.type === 'RECEITA' ? 'success' : 'error'}
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {cat.dre_group ? (
                                            <Chip
                                                label={DRE_GROUP_LABELS[cat.dre_group]}
                                                size="small"
                                                color={DRE_GROUP_COLOR[cat.dre_group]}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.disabled">Não definido</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar Grupo DRE">
                                            <IconButton size="small" onClick={() => { setEditTarget(cat); setEditGroup(cat.dre_group ?? '') }}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(cat.id, cat.name)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {/* Dialog — Nova Categoria */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Nova Categoria</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField
                            label="Nome" size="small" fullWidth autoFocus
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        />
                        <TextField
                            select label="Tipo" size="small" fullWidth
                            value={form.type}
                            onChange={e => setForm(f => ({ ...f, type: e.target.value as 'RECEITA' | 'DESPESA' }))}
                        >
                            <MenuItem value="RECEITA">Receita</MenuItem>
                            <MenuItem value="DESPESA">Despesa</MenuItem>
                        </TextField>
                        <TextField
                            select label="Grupo DRE (opcional)" size="small" fullWidth
                            value={form.dre_group}
                            onChange={e => setForm(f => ({ ...f, dre_group: e.target.value as DreGroup | '' }))}
                        >
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            <Divider />
                            {DRE_GROUPS.map(g => (
                                <MenuItem key={g} value={g}>{DRE_GROUP_LABELS[g]}</MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={saving || !form.name.trim()}>
                        {saving ? <CircularProgress size={18} /> : 'Criar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog — Editar Grupo DRE */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar Grupo DRE — {editTarget?.name}</DialogTitle>
                <DialogContent>
                    <TextField
                        select label="Grupo DRE" size="small" fullWidth sx={{ mt: 1 }}
                        value={editGroup}
                        onChange={e => setEditGroup(e.target.value as DreGroup | '')}
                    >
                        <MenuItem value=""><em>Nenhum</em></MenuItem>
                        <Divider />
                        {DRE_GROUPS.map(g => (
                            <MenuItem key={g} value={g}>{DRE_GROUP_LABELS[g]}</MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveDreGroup} disabled={saving}>
                        {saving ? <CircularProgress size={18} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
