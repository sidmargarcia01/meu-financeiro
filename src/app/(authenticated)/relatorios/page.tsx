/**
 * Descricao: Relatorio financeiro dinamico por categoria com graficos donut
 * Contexto: Modulo de Relatorios do Meu Financeiro
 * Responsavel: Windsurf AI
 * Data: 2026-06-01
 * Tecnologias: Next.js, React, TypeScript, MUI, Recharts
 */

'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import {
  Box, Paper, Typography, IconButton, CircularProgress,
  Alert, ToggleButton, ToggleButtonGroup, Tooltip, Divider, Chip, Drawer
} from '@mui/material'
import {
  ChevronLeft as PrevIcon, ChevronRight as NextIcon,
  CalendarToday as CalendarIcon, Close as CloseIcon,
  ViewDay as ViewDayIcon, DateRange as DateRangeIcon,
  CalendarMonth as CalendarMonthIcon,
  TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
  AccountBalance as BalanceIcon, Edit as EditIcon
} from '@mui/icons-material'
import { PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer } from 'recharts'
import { TransactionForm } from '@/components/transactions/TransactionForm'
import type { TransactionFormData, Account, Category } from '@/components/transactions/TransactionForm'

const CAT_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#a78bfa', '#fb923c', '#4ade80', '#f472b6',
  '#38bdf8', '#fbbf24', '#34d399', '#fb7185', '#818cf8'
]

const clrs = {
  primary: '#6366f1', receita: '#10b981', despesa: '#ef4444',
  border: '#e5e7eb', textPrimary: '#111827', textSecondary: '#6b7280', bgPage: '#f9fafb'
}

const DEFAULT_SETTINGS = {
  enable_competence_date: true,
  require_cost_center: false,
  require_project: false,
  require_contact: false,
  require_tag: false,
  require_subcategory: false,
  installment_default: 'VALOR_PARCELA' as const
}

function toLocalDateString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function getWeekRange(d: Date) {
  const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day
  return { start: new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff), end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff + 6) }
}
function getMonthRange(d: Date) {
  return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 0) }
}
function fmtCurrency(v: number) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }

interface Transaction {
  id: string; type: 'RECEITA' | 'DESPESA' | 'TRANSFERENCIA'
  amount: number; description: string; due_date: string
  category_name?: string; account_name?: string; account_id?: string
  status: string; notes?: string; tags?: string[]
}
interface CatData { name: string; value: number; pct: number; color: string; transactions: Transaction[] }

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d: CatData = payload[0].payload
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: 2, minWidth: 160 }}>
      <Typography variant="body2" fontWeight={700} sx={{ color: d.color }}>{d.name}</Typography>
      <Typography variant="body2">{fmtCurrency(Math.abs(d.value))}</Typography>
      <Typography variant="caption" color="text.secondary">{d.pct.toFixed(1)}% do total</Typography>
    </Paper>
  )
}

const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct }: any) => {
  if (pct < 4) return null
  const R = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${pct.toFixed(0)}%`}
    </text>
  )
}

interface ChartCardProps {
  title: string; color: string; data: CatData[]; total: number
  activeIdx: number | null; selectedName: string | null
  onEnter: (i: number) => void; onLeave: () => void; onClick: (c: CatData) => void
}

function ChartCard({ title, color, data, total, activeIdx, selectedName, onEnter, onLeave, onClick }: ChartCardProps) {
  if (data.length === 0) return (
    <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${clrs.border}`, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 420 }}>
      <Typography color="text.secondary" variant="body2" fontWeight={600}>{title}</Typography>
      <Typography color="text.disabled" variant="caption">Sem dados no periodo</Typography>
    </Paper>
  )
  return (
    <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${clrs.border}`, p: 2.5, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>{title}</Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color }}>{fmtCurrency(total)}</Typography>
      </Box>
      <Box sx={{ width: '100%', height: 260 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100}
              paddingAngle={2} dataKey="value" labelLine={false} label={renderLabel}
              onMouseEnter={(_: any, i: number) => onEnter(i)} onMouseLeave={onLeave}
              onClick={(d: any) => onClick(d as CatData)} style={{ cursor: 'pointer' }}>
              {data.map((e, i) => (
                <Cell key={e.name} fill={e.color}
                  stroke={selectedName === e.name ? '#1a1a2e' : 'white'}
                  strokeWidth={selectedName === e.name ? 3 : 1.5}
                  opacity={activeIdx !== null && activeIdx !== i ? 0.5 : 1}
                  style={{
                    transition: 'opacity 0.2s, transform 0.2s', transformOrigin: 'center',
                    transform: activeIdx === i ? 'scale(1.05)' : 'scale(1)'
                  }} />
              ))}
            </Pie>
            <RTooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4, maxHeight: 210, overflow: 'auto' }}>
        {data.map(cat => (
          <Box key={cat.name} onClick={() => onClick(cat)} sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 1, py: 0.6,
            borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s',
            bgcolor: selectedName === cat.name ? cat.color + '18' : 'transparent',
            border: `1px solid ${selectedName === cat.name ? cat.color + '44' : 'transparent'}`,
            '&:hover': { bgcolor: cat.color + '12' }
          }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ flex: 1, fontWeight: selectedName === cat.name ? 700 : 400, color: '#374151' }} noWrap>{cat.name}</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: cat.color }}>{cat.pct.toFixed(1)}%</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ minWidth: 80, textAlign: 'right' }}>{fmtCurrency(cat.value)}</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

export default function RelatoriosPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<{ cat: CatData; type: 'RECEITA' | 'DESPESA' } | null>(null)
  const [activeIdx, setActiveIdx] = useState<{ chart: 'r' | 'd'; idx: number } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Transaction | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/accounts?balances=true').then(r => r.json()).then(d => setAccounts(Array.isArray(d) ? d : [])).catch(() => { })
    fetch('/api/categories').then(r => r.json()).then(d => {
      setCategories(Array.isArray(d) ? d.map((c: Category) => ({ ...c, children: c.children || [] })) : [])
    }).catch(() => { })
  }, [])

  const periodRange = useMemo(() => {
    if (viewMode === 'week') return getWeekRange(currentDate)
    if (viewMode === 'month') return getMonthRange(currentDate)
    return { start: currentDate, end: currentDate }
  }, [viewMode, currentDate])

  const startStr = useMemo(() => toLocalDateString(periodRange.start), [periodRange])
  const endStr = useMemo(() => toLocalDateString(periodRange.end), [periodRange])

  const periodLabel = useMemo(() => {
    if (viewMode === 'day') return currentDate.toLocaleDateString('pt-BR')
    if (viewMode === 'week') {
      const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      return `${fmt(periodRange.start)} - ${fmt(periodRange.end)}/${periodRange.end.getFullYear()}`
    }
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [viewMode, currentDate, periodRange])

  const goToPrev = () => setCurrentDate(prev => {
    const nd = new Date(prev)
    if (viewMode === 'day') nd.setDate(nd.getDate() - 1)
    else if (viewMode === 'week') nd.setDate(nd.getDate() - 7)
    else { nd.setDate(1); nd.setMonth(nd.getMonth() - 1) }
    return nd
  })
  const goToNext = () => setCurrentDate(prev => {
    const nd = new Date(prev)
    if (viewMode === 'day') nd.setDate(nd.getDate() + 1)
    else if (viewMode === 'week') nd.setDate(nd.getDate() + 7)
    else { nd.setDate(1); nd.setMonth(nd.getMonth() + 1) }
    return nd
  })

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null); setSelected(null)
    try {
      const p = new URLSearchParams({ limit: '2000', startDate: startStr, endDate: endStr })
      const res = await fetch(`/api/transactions?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const all: Transaction[] = Array.isArray(data) ? data : (data.data ?? [])
      setTransactions(all.filter(t => {
        if (t.type === 'TRANSFERENCIA') return false
        const desc = t.description?.toLowerCase() ?? ''
        if (desc.startsWith('transfer') && (desc.includes(' para ') || desc.includes(' de '))) return false
        return true
      }))
    } catch { setError('Erro ao carregar dados.') }
    finally { setLoading(false) }
  }, [startStr, endStr])

  useEffect(() => { fetchData() }, [fetchData])

  const openEdit = (tx: Transaction) => { setEditTarget(tx); setSubmitError(null); setFormOpen(true) }
  const closeForm = () => { setFormOpen(false); setEditTarget(null); setSubmitError(null) }

  const handleSubmit = async (formData: TransactionFormData) => {
    if (submitting || !editTarget) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        dueDate: formData.due_date,
        accountId: formData.account_id || undefined,
        status: formData.status || 'PENDENTE',
        regime: formData.regime || 'CAIXA',
        isRecurring: formData.repetition_type !== 'NONE',
        tags: (formData.tags || []).filter(Boolean),
      }
      if (formData.category_id) payload.categoryId = formData.category_id
      if (formData.center_id) payload.centerId = formData.center_id
      if (formData.project_id) payload.projectId = formData.project_id
      if (formData.contact_id) payload.contactId = formData.contact_id
      if (formData.notes) payload.notes = formData.notes

      const response = await fetch(`/api/transactions/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.error || 'Erro ao salvar')
      }
      closeForm()
      fetchData()
    } catch (e: any) {
      setSubmitError(e?.message || 'Erro ao salvar lancamento.')
    } finally {
      setSubmitting(false)
    }
  }

  const buildData = useCallback((type: 'RECEITA' | 'DESPESA'): CatData[] => {
    const map = new Map<string, { value: number; txs: Transaction[] }>()
    transactions.filter(t => t.type === type).forEach(t => {
      const cat = t.category_name || 'Sem categoria'
      const cur = map.get(cat) || { value: 0, txs: [] }
      map.set(cat, { value: cur.value + Math.abs(t.amount), txs: [...cur.txs, t] })
    })
    const total = Array.from(map.values()).reduce((s, v) => s + v.value, 0)
    return Array.from(map.entries())
      .sort((a, b) => b[1].value - a[1].value)
      .map(([name, { value, txs }], i) => ({
        name, value, pct: total > 0 ? (value / total) * 100 : 0,
        color: CAT_COLORS[i % CAT_COLORS.length],
        transactions: txs.sort((a, b) => b.due_date.localeCompare(a.due_date))
      }))
  }, [transactions])

  const despesaData = useMemo(() => buildData('DESPESA'), [buildData])
  const receitaData = useMemo(() => buildData('RECEITA'), [buildData])
  const totalD = useMemo(() => despesaData.reduce((s, d) => s + d.value, 0), [despesaData])
  const totalR = useMemo(() => receitaData.reduce((s, d) => s + d.value, 0), [receitaData])
  const saldo = totalR - totalD

  const toggleSelect = (cat: CatData, type: 'RECEITA' | 'DESPESA') =>
    setSelected(s => s?.cat.name === cat.name && s.type === type ? null : { cat, type })

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: clrs.bgPage, overflow: 'hidden' }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 0, display: 'flex', alignItems: 'center', borderBottom: `1px solid ${clrs.border}`, bgcolor: 'white' }}>
        <Typography variant="h6" fontWeight={600} color={clrs.textPrimary}>Relatorios por Categoria</Typography>
      </Paper>

      <Paper elevation={0} sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${clrs.border}`, bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <ToggleButtonGroup value={viewMode} exclusive onChange={(_: any, v: any) => { if (v) setViewMode(v) }} size="small"
          sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.4, border: `1px solid ${clrs.border}`, fontSize: '0.7rem', fontWeight: 600, color: clrs.textSecondary, '&.Mui-selected': { bgcolor: clrs.primary, color: 'white', borderColor: clrs.primary } } }}>
          <Tooltip title="Diario"><ToggleButton value="day"><ViewDayIcon sx={{ fontSize: 16 }} /></ToggleButton></Tooltip>
          <Tooltip title="Semanal"><ToggleButton value="week"><DateRangeIcon sx={{ fontSize: 16 }} /></ToggleButton></Tooltip>
          <Tooltip title="Mensal"><ToggleButton value="month"><CalendarMonthIcon sx={{ fontSize: 16 }} /></ToggleButton></Tooltip>
        </ToggleButtonGroup>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton size="small" onClick={goToPrev} sx={{ color: clrs.textSecondary, '&:hover': { bgcolor: '#f5f5f5' } }}><PrevIcon fontSize="small" /></IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: '8px', '&:hover': { bgcolor: '#f5f5f5' } }} onClick={() => dateInputRef.current?.showPicker?.()}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: clrs.textPrimary, minWidth: viewMode === 'week' ? 160 : 120, textAlign: 'center' }}>{periodLabel}</Typography>
            <CalendarIcon fontSize="small" sx={{ color: clrs.textSecondary }} />
          </Box>
          <IconButton size="small" onClick={goToNext} sx={{ color: clrs.textSecondary, '&:hover': { bgcolor: '#f5f5f5' } }}><NextIcon fontSize="small" /></IconButton>
          <input ref={dateInputRef} type={viewMode === 'month' ? 'month' : 'date'}
            value={viewMode === 'month' ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '00')}` : toLocalDateString(currentDate)}
            onChange={e => {
              if (!e.target.value) return
              if (viewMode === 'month') { const [y, m] = e.target.value.split('-').map(Number); setCurrentDate(new Date(y, m - 1, 1)) }
              else { const [y, m, d] = e.target.value.split('-').map(Number); setCurrentDate(new Date(y, m - 1, d)) }
            }} style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, ml: 'auto', flexWrap: 'wrap' }}>
          {([
            { label: 'Receitas', value: totalR, color: clrs.receita, icon: 'up' },
            { label: 'Despesas', value: totalD, color: clrs.despesa, icon: 'down' },
            { label: 'Saldo', value: saldo, color: saldo >= 0 ? clrs.receita : clrs.despesa, icon: 'bal' }
          ] as const).map(c => (
            <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 1.5, py: 0.75, borderRadius: '10px', border: `1px solid ${c.color}33`, bgcolor: `${c.color}0d` }}>
              <Box sx={{ color: c.color }}>
                {c.icon === 'up' && <TrendingUpIcon sx={{ fontSize: 18 }} />}
                {c.icon === 'down' && <TrendingDownIcon sx={{ fontSize: 18 }} />}
                {c.icon === 'bal' && <BalanceIcon sx={{ fontSize: 18 }} />}
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>{c.label}</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: c.color }}>
                  {c.label === 'Saldo' && c.value < 0 ? `- ${fmtCurrency(Math.abs(c.value))}` : fmtCurrency(Math.abs(c.value))}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress /></Box>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && !error && (
          <Box sx={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr 360px' : '1fr 1fr', gap: 3, maxWidth: 1400, mx: 'auto' }}>
            <ChartCard title="Despesas por Categoria" color={clrs.despesa}
              data={despesaData} total={totalD}
              activeIdx={activeIdx?.chart === 'd' ? activeIdx.idx : null}
              selectedName={selected?.type === 'DESPESA' ? selected.cat.name : null}
              onEnter={i => setActiveIdx({ chart: 'd', idx: i })} onLeave={() => setActiveIdx(null)}
              onClick={cat => toggleSelect(cat, 'DESPESA')} />

            <ChartCard title="Receitas por Categoria" color={clrs.receita}
              data={receitaData} total={totalR}
              activeIdx={activeIdx?.chart === 'r' ? activeIdx.idx : null}
              selectedName={selected?.type === 'RECEITA' ? selected.cat.name : null}
              onEnter={i => setActiveIdx({ chart: 'r', idx: i })} onLeave={() => setActiveIdx(null)}
              onClick={cat => toggleSelect(cat, 'RECEITA')} />

            {selected && (
              <Paper elevation={0} sx={{ borderRadius: '16px', border: `1px solid ${clrs.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '75vh', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${clrs.border}`, bgcolor: selected.cat.color + '14' }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: selected.cat.color }}>{selected.cat.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selected.cat.transactions.length} lancamentos · {fmtCurrency(selected.cat.value)} · {selected.cat.pct.toFixed(1)}%
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setSelected(null)}><CloseIcon fontSize="small" /></IconButton>
                </Box>
                <Box sx={{ overflow: 'auto', flex: 1 }}>
                  {selected.cat.transactions.map(tx => (
                    <Box key={tx.id}
                      onClick={() => openEdit(tx)}
                      sx={{
                        px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: `1px solid ${clrs.border}`, cursor: 'pointer', transition: 'background 0.15s',
                        '&:hover': { bgcolor: '#f0f4ff' },
                        '&:hover .edit-hint': { opacity: 1 }
                      }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="body2" fontWeight={500} noWrap>{tx.description}</Typography>
                          <EditIcon className="edit-hint" sx={{ fontSize: 13, color: clrs.primary, opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(tx.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          {tx.account_name ? ` · ${tx.account_name}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ ml: 2, textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ color: selected.type === 'DESPESA' ? clrs.despesa : clrs.receita }}>
                          {fmtCurrency(Math.abs(tx.amount))}
                        </Typography>
                        <Chip label={tx.status} size="small" sx={{ fontSize: '0.62rem', height: 18, mt: 0.25 }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        )}
      </Box>

      <Drawer anchor="right" open={formOpen} onClose={closeForm}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}>
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={600}>Editar Lancamento</Typography>
          <IconButton onClick={closeForm}><CloseIcon /></IconButton>
        </Box>
        {submitError && (
          <Box px={2} pb={1}>
            <Alert severity="error" onClose={() => setSubmitError(null)}>{submitError}</Alert>
          </Box>
        )}
        <TransactionForm
          initialData={editTarget ? {
            account_id: editTarget.account_id ?? '',
            type: editTarget.type as 'RECEITA' | 'DESPESA',
            amount: Math.abs(editTarget.amount),
            due_date: editTarget.due_date,
            description: editTarget.description,
            status: (editTarget.status === 'AGENDADO' ? 'PENDENTE' : editTarget.status) as 'PENDENTE' | 'CONFIRMADO' | 'CONCILIADO',
            category_id: '',
            center_id: '',
            project_id: '',
            contact_id: '',
            notes: editTarget.notes || '',
            tags: editTarget.tags || [],
            regime: 'CAIXA',
            repetition_type: 'NONE'
          } : undefined}
          accounts={accounts}
          categories={categories}
          settings={DEFAULT_SETTINGS}
          isLoading={submitting}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Drawer>
    </Box>
  )
}