/**
 * 📄 Descrição: Página de Categorias — CRUD completo com subcategorias e auto-seed
 * 🧱 Contexto: Cadastros — rota /cadastros/categorias
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-22
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/categories, /api/categories/importar-padrao
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Box, Typography, Stack, Button, IconButton, Tooltip, Alert, Chip,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Paper, Table, TableHead, TableRow, TableCell,
    TableBody, Divider, Collapse,
} from '@mui/material'
import {
    Add as AddIcon, Delete as DeleteIcon,
    Edit as EditIcon, Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
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

// ─── Formulário vazio ─────────────────────────────────────────────────────────
type FormState = {
    name: string
    type: 'RECEITA' | 'DESPESA'
    dre_group: DreGroup | ''
    parent_id: string | null
}
const EMPTY_FORM: FormState = { name: '', type: 'DESPESA', dre_group: '', parent_id: null }

// ─── Linha de categoria na tabela ─────────────────────────────────────────────
function CatRow({
    cat,
    onEdit,
    onDelete,
    onAddSub,
}: {
    cat: Category
    onEdit: (c: Category) => void
    onDelete: (c: Category) => void
    onAddSub: (parent: Category) => void
}) {
    const [open, setOpen] = useState(true)
    const hasChildren = (cat.children?.length ?? 0) > 0

    return (
        <>
            <TableRow hover sx={{ bgcolor: 'white' }}>
                <TableCell sx={{ fontWeight: 600, pl: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        {hasChildren ? (
                            <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ p: 0.25 }}>
                                {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                            </IconButton>
                        ) : <Box sx={{ width: 28 }} />}
                        {cat.name}
                    </Stack>
                </TableCell>
                <TableCell>
                    <Chip label={cat.type === 'RECEITA' ? 'Receita' : 'Despesa'} size="small"
                        color={cat.type === 'RECEITA' ? 'success' : 'error'} variant="outlined" />
                </TableCell>
                <TableCell>
                    {cat.dre_group
                        ? <Chip label={DRE_GROUP_LABELS[cat.dre_group]} size="small" color={DRE_GROUP_COLOR[cat.dre_group]} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                </TableCell>
                <TableCell align="right">
                    <Tooltip title="Nova subcategoria">
                        <IconButton size="small" onClick={() => onAddSub(cat)}><AddIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(cat)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                        <IconButton size="small" color="error" onClick={() => onDelete(cat)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                </TableCell>
            </TableRow>

            {hasChildren && (
                <TableRow sx={{ p: 0 }}>
                    <TableCell colSpan={4} sx={{ p: 0, border: 0 }}>
                        <Collapse in={open}>
                            <Table size="small">
                                <TableBody>
                                    {cat.children!.map(sub => (
                                        <TableRow key={sub.id} hover sx={{ bgcolor: 'grey.50' }}>
                                            <TableCell sx={{ pl: 7, width: '40%' }}>
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography color="text.disabled" fontSize="0.9rem">↳</Typography>
                                                    <span>{sub.name}</span>
                                                </Stack>
                                            </TableCell>
                                            <TableCell sx={{ width: '20%' }}>
                                                <Chip label={sub.type === 'RECEITA' ? 'Receita' : 'Despesa'} size="small"
                                                    color={sub.type === 'RECEITA' ? 'success' : 'error'} variant="outlined" />
                                            </TableCell>
                                            <TableCell sx={{ width: '30%' }}>
                                                {sub.dre_group
                                                    ? <Chip label={DRE_GROUP_LABELS[sub.dre_group]} size="small" color={DRE_GROUP_COLOR[sub.dre_group]} />
                                                    : <Typography variant="caption" color="text.disabled">—</Typography>}
                                            </TableCell>
                                            <TableCell align="right" sx={{ width: '10%' }}>
                                                <Tooltip title="Editar">
                                                    <IconButton size="small" onClick={() => onEdit(sub)}><EditIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                                <Tooltip title="Excluir">
                                                    <IconButton size="small" color="error" onClick={() => onDelete(sub)}><DeleteIcon fontSize="small" /></IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Collapse>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function CategoriasPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const seeded = useRef(false)

    // ── Dialogs ────────────────────────────────────────────────────────────────
    const [openCreate, setOpenCreate] = useState(false)
    const [form, setForm] = useState<FormState>({ ...EMPTY_FORM })

    const [editTarget, setEditTarget] = useState<Category | null>(null)
    const [editForm, setEditForm] = useState<{ name: string; dre_group: DreGroup | '' }>({ name: '', dre_group: '' })

    // ── Auto-seed na primeira visita ─────────────────────────────────────────
    const fetchCategories = useCallback(async (attemptSeed = false) => {
        setLoading(true); setError(null)
        try {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('Erro ao carregar categorias')
            const data: Category[] = await res.json()
            setCategories(data)

            // Se vazio e ainda nao tentou seed, tenta criar padroes
            if (attemptSeed && data.length === 0 && !seeded.current) {
                seeded.current = true
                let retries = 0
                const maxRetries = 3

                while (retries < maxRetries) {
                    try {
                        const seed = await fetch('/api/categories/importar-padrao', { method: 'POST' })
                        if (seed.ok) {
                            const fresh = await fetch('/api/categories')
                            if (fresh.ok) {
                                setCategories(await fresh.json())
                                setSuccess('Categorias padrão criadas automaticamente!')
                                setLoading(false)
                                return
                            }
                        } else {
                            const errData = await seed.json().catch(() => ({}))
                            console.error(`[SEED] Tentativa ${retries + 1} falhou:`, errData)
                        }
                    } catch (e: any) {
                        console.error(`[SEED] Tentativa ${retries + 1} erro:`, e.message)
                    }
                    retries++
                    if (retries < maxRetries) {
                        await new Promise(r => setTimeout(r, 1000)) // Aguarda 1s antes de retry
                    }
                }

                setError('Erro ao criar categorias padrão. Verifique os logs do servidor.')
            }
        } catch (err: any) {
            setError(err.message)
        } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchCategories(true) }, [fetchCategories])

    // ── Criar ──────────────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            const body: Record<string, any> = { name: form.name.trim(), type: form.type }
            if (form.dre_group) body.dre_group = form.dre_group
            if (form.parent_id) body.parent_id = form.parent_id
            const res = await fetch('/api/categories', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setOpenCreate(false); setForm({ ...EMPTY_FORM })
            setSuccess('Categoria criada!')
            fetchCategories()
        } catch (err: any) { setError(err.message) }
        finally { setSaving(false) }
    }

    // ── Editar ─────────────────────────────────────────────────────────────────
    const openEdit = (cat: Category) => {
        setEditTarget(cat)
        setEditForm({ name: cat.name, dre_group: cat.dre_group ?? '' })
    }

    const handleSaveEdit = async () => {
        if (!editTarget) return
        setSaving(true)
        try {
            const res = await fetch(`/api/categories/${editTarget.id}`, {
                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editForm.name.trim(), dre_group: editForm.dre_group || null }),
            })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setEditTarget(null); setSuccess('Categoria atualizada!')
            fetchCategories()
        } catch (err: any) { setError(err.message) }
        finally { setSaving(false) }
    }

    // ── Excluir ────────────────────────────────────────────────────────────────
    const handleDelete = async (cat: Category) => {
        const msg = cat.children?.length
            ? `Excluir "${cat.name}" e suas ${cat.children.length} subcategoria(s)?`
            : `Excluir "${cat.name}"?`
        if (!confirm(msg)) return
        try {
            const res = await fetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
            if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
            setSuccess('Categoria excluída.')
            fetchCategories()
        } catch (err: any) { setError(err.message) }
    }

    // ── Abrir create para subcategoria ─────────────────────────────────────────
    const handleAddSub = (parent: Category) => {
        setForm({ ...EMPTY_FORM, type: parent.type, parent_id: parent.id })
        setOpenCreate(true)
    }

    // ── Categorias raiz para select de parent ─────────────────────────────────
    const rootCategories = categories.filter(c => !c.parent_id)

    return (
        <Box sx={{ p: 3 }}>
            {/* Cabeçalho */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h5" fontWeight={700}>Categorias</Typography>
                    <Typography variant="caption" color="text.secondary">
                        Grupo DRE define a posição no Demonstrativo de Resultado (Margem Bruta, EBITDA…)
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    <Button variant="contained" startIcon={<AddIcon />} size="small"
                        onClick={() => { setForm({ ...EMPTY_FORM }); setOpenCreate(true) }}>
                        Nova Categoria
                    </Button>
                    <Tooltip title="Atualizar">
                        <IconButton size="small" onClick={() => fetchCategories()} disabled={loading}><RefreshIcon /></IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" gap={2} py={8}>
                    <CircularProgress />
                    <Typography color="text.secondary">Carregando...</Typography>
                </Box>
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
                            {rootCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                        <Stack spacing={2} alignItems="center">
                                            <CircularProgress size={24} sx={{ mb: 1 }} />
                                            <Typography color="text.secondary">
                                                Nenhuma categoria cadastrada
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled">
                                                9 grupos DRE + 46 subcategorias
                                            </Typography>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ) : rootCategories.map(cat => (
                                <CatRow key={cat.id} cat={cat}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onAddSub={handleAddSub}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {/* ── Dialog Criar/Nova Subcategoria ─────────────────────────────── */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{form.parent_id ? 'Nova Subcategoria' : 'Nova Categoria'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Nome" size="small" fullWidth autoFocus
                            placeholder="Nome da categoria"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

                        {!form.parent_id && (
                            <TextField select label="Categoria pai (opcional)" size="small" fullWidth
                                value={form.parent_id ?? ''}
                                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value || null }))}
                            >
                                <MenuItem value=""><em>Nenhuma (categoria raiz)</em></MenuItem>
                                <Divider />
                                {rootCategories.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </TextField>
                        )}

                        {form.parent_id && (
                            <TextField size="small" fullWidth label="Categoria pai" disabled
                                value={rootCategories.find(c => c.id === form.parent_id)?.name ?? ''} />
                        )}

                        <TextField select label="Tipo" size="small" fullWidth
                            value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'RECEITA' | 'DESPESA' }))}
                        >
                            <MenuItem value="RECEITA">Receita</MenuItem>
                            <MenuItem value="DESPESA">Despesa</MenuItem>
                        </TextField>

                        <TextField select label="Grupo DRE (opcional)" size="small" fullWidth
                            value={form.dre_group} onChange={e => setForm(f => ({ ...f, dre_group: e.target.value as DreGroup | '' }))}
                        >
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            <Divider />
                            {DRE_GROUPS.map(g => <MenuItem key={g} value={g}>{DRE_GROUP_LABELS[g]}</MenuItem>)}
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

            {/* ── Dialog Editar ──────────────────────────────────────────────── */}
            <Dialog open={!!editTarget} onClose={() => setEditTarget(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar — {editTarget?.name}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField label="Nome" size="small" fullWidth autoFocus
                            value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                        <TextField select label="Grupo DRE" size="small" fullWidth
                            value={editForm.dre_group} onChange={e => setEditForm(f => ({ ...f, dre_group: e.target.value as DreGroup | '' }))}
                        >
                            <MenuItem value=""><em>Nenhum</em></MenuItem>
                            <Divider />
                            {DRE_GROUPS.map(g => <MenuItem key={g} value={g}>{DRE_GROUP_LABELS[g]}</MenuItem>)}
                        </TextField>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditTarget(null)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleSaveEdit} disabled={saving || !editForm.name.trim()}>
                        {saving ? <CircularProgress size={18} /> : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    )
}
