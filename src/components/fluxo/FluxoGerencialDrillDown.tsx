/**
 * 📄 Descrição: Drawer de drill-down da matriz — lista e edita lançamentos de uma linha
 * 🧱 Contexto: Módulo Movimentações — tabela /movimentacoes/fluxo
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-07-14
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: TransactionForm, formatCurrency, formatDate
 * ✅ Revisado: Sim
 */

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Drawer,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  Stack,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { TransactionFormData } from '@/components/transactions/TransactionForm'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate } from '@/utils/formatDate'

interface FluxoDrillDownTransaction {
  id: string
  description: string
  amount: number
  type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  status: 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO'
  due_date: string
  payment_date?: string
  account_id?: string
  account_name?: string
  category_id?: string
  category_name?: string
  dre_group?: string | null
  regime?: 'CAIXA' | 'COMPETENCIA'
}

interface FluxoGerencialDrillDownProps {
  open: boolean
  onClose: () => void
  lineId: string
  lineLabel: string
  inicio: string
  fim: string
  regime: 'CAIXA' | 'COMPETENCIA'
  onSaved: () => void
}

interface LineCriteria {
  type?: 'RECEITA' | 'DESPESA'
  dreGroups?: string[] | null
  categoryId?: string
}

function getLineCriteria(lineId: string): LineCriteria | undefined {
  // Categoria/subcategoria do fluxo
  if (lineId.startsWith('cat:')) {
    const categoryId = lineId.split(':')[1]
    return { categoryId }
  }
  if (lineId.startsWith('sub:')) {
    const categoryId = lineId.split(':')[1]
    return { categoryId }
  }

  switch (lineId) {
    case 'receita_faturamento':
      return { type: 'RECEITA', dreGroups: ['RECEITAS_OPERACIONAIS', 'IMPOSTOS_FATURAMENTO'] }
    case 'custos_variaveis':
      return { type: 'DESPESA', dreGroups: ['CUSTOS_OPERACIONAIS', 'DESPESAS_VARIAVEIS'] }
    case 'despesas_fixas':
      return { type: 'DESPESA', dreGroups: ['DESPESAS_FIXAS'] }
    case 'investimentos':
      return { type: 'DESPESA', dreGroups: ['INVESTIMENTOS'] }
    case 'movimentacoes_nao_operacionais':
      return { dreGroups: ['RECEITAS_NAO_OPERACIONAIS', 'DESPESAS_NAO_OPERACIONAIS', 'IMPOSTOS_LUCRO', 'DISTRIBUICAO_LUCROS'] }
    case 'receitas_sem_categoria':
      return { type: 'RECEITA', dreGroups: [] }
    case 'despesas_sem_categoria':
      return { type: 'DESPESA', dreGroups: [] }
    default:
      return undefined
  }
}

function statusColor(status: string): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  switch (status) {
    case 'CONCILIADO': return 'primary'
    case 'CONFIRMADO': return 'success'
    case 'PENDENTE': return 'warning'
    case 'AGENDADO': return 'default'
    default: return 'default'
  }
}

export function FluxoGerencialDrillDown({
  open,
  onClose,
  lineId,
  lineLabel,
  inicio,
  fim,
  regime,
  onSaved,
}: FluxoGerencialDrillDownProps) {
  const [transactions, setTransactions] = useState<FluxoDrillDownTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<FluxoDrillDownTransaction | null>(null)
  const [deleting, setDeleting] = useState<FluxoDrillDownTransaction | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [metaLoading, setMetaLoading] = useState(false)

  const criteria = useMemo(() => getLineCriteria(lineId), [lineId])

  useEffect(() => {
    if (!open) return
    setMetaLoading(true)
    Promise.all([
      fetch('/api/accounts').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ])
      .then(([acc, cat, set]) => {
        setAccounts(Array.isArray(acc) ? acc : [])
        setCategories(Array.isArray(cat) ? cat : [])
        setSettings(set || {})
      })
      .catch(() => setError('Erro ao carregar dados do formulário.'))
      .finally(() => setMetaLoading(false))
  }, [open])

  const fetchTransactions = async () => {
    if (!criteria) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('startDate', inicio)
      params.set('endDate', fim)
      params.set('limit', '1000')
      params.set('dateField', regime === 'COMPETENCIA' ? 'competence_date' : 'due_date')
      params.set('statuses', regime === 'CAIXA' ? 'CONFIRMADO,CONCILIADO' : 'PENDENTE,CONFIRMADO,CONCILIADO')
      if (criteria.type) params.set('type', criteria.type)
      if (criteria.categoryId) params.set('categoryId', criteria.categoryId)

      const res = await fetch(`/api/transactions?${params}`)
      if (!res.ok) throw new Error('Erro ao buscar lançamentos')
      const data = await res.json()
      const all = Array.isArray(data.transactions) ? data.transactions : Array.isArray(data) ? data : []

      let filtered = all
      if (criteria && criteria.dreGroups !== undefined) {
        const groups = criteria.dreGroups
        filtered = all.filter((t: any) => {
          const txDre = t.dre_group ?? null
          if (groups === null) return true
          if (groups.length === 0) return txDre === null
          return groups.includes(txDre)
        })
      }

      setTransactions(filtered)
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar lançamentos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchTransactions()
  }, [open, lineId, inicio, fim, regime])

  const handleDelete = async () => {
    if (!deleting) return
    try {
      const res = await fetch(`/api/transactions/${deleting.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setDeleting(null)
      fetchTransactions()
      onSaved()
    } catch {
      setError('Erro ao excluir lançamento.')
    }
  }

  const handleSave = async (formData: TransactionFormData) => {
    if (!editing) return
    try {
      const res = await fetch(`/api/transactions/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      setEditing(null)
      fetchTransactions()
      onSaved()
    } catch {
      setError('Erro ao salvar lançamento.')
    }
  }

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 520 } } }}>
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 420 }}>
              {lineLabel}
            </Typography>
            <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
          </Stack>

          <Typography variant="caption" color="text.secondary" mb={2}>
            Período: {formatDate(inicio)} a {formatDate(fim)} · Regime: {regime}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : transactions.length === 0 ? (
            <Alert severity="info">Nenhum lançamento encontrado para este item.</Alert>
          ) : (
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {transactions.map(tx => (
                <ListItem
                  key={tx.id}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" size="small" onClick={() => setEditing(tx)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton edge="end" size="small" onClick={() => setDeleting(tx)}><DeleteIcon fontSize="small" /></IconButton>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" fontWeight={600}>{tx.description}</Typography>
                        <Chip label={tx.status} size="small" color={statusColor(tx.status)} sx={{ height: 20, fontSize: 10 }} />
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(tx.due_date)} · {tx.account_name || 'Sem conta'} · {tx.category_name || 'Sem categoria'} ·{' '}
                        <Typography component="span" variant="caption" color={tx.type === 'RECEITA' ? 'success.main' : 'error.main'} fontWeight={600}>
                          {formatCurrency(Math.abs(tx.amount))}
                        </Typography>
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {editing && settings && (
        <Dialog open onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Editar Lançamento</DialogTitle>
          <DialogContent>
            <TransactionForm
              initialData={{
                ...editing,
                regime: editing.regime || regime,
                tags: [],
                repetition_type: 'NONE',
              } as any}
              onSubmit={handleSave}
              onCancel={() => setEditing(null)}
              accounts={accounts}
              categories={categories}
              settings={settings}
            />
          </DialogContent>
        </Dialog>
      )}

      {deleting && (
        <Dialog open onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Excluir lançamento?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">Deseja excluir "{deleting.description}"?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleting(null)}>Cancelar</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Excluir</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}
