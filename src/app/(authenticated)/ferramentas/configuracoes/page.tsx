/**
 * 📄 Descrição: Configurações do Sistema — preferências do usuário
 * 🧱 Contexto: Módulo 8 — rota /ferramentas/configuracoes
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * 🔍 Dependências: /api/settings (GET/PUT)
 * ✅ Revisado: Sim
 */

'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Stack, CircularProgress, Alert, Switch, FormControlLabel,
  Button, Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material'

interface Settings {
  enableCompetenceDate: boolean
  requireCostCenter: boolean
  requireProject: boolean
  requireContact: boolean
  requireTag: boolean
  requireSubcategory: boolean
  installmentDefault: 'VALOR_PARCELA' | 'VALOR_TOTAL'
}

const DEFAULTS: Settings = {
  enableCompetenceDate: false,
  requireCostCenter: false,
  requireProject: false,
  requireContact: false,
  requireTag: false,
  requireSubcategory: false,
  installmentDefault: 'VALOR_PARCELA',
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setSettings({
        enableCompetenceDate: data.enableCompetenceDate ?? DEFAULTS.enableCompetenceDate,
        requireCostCenter: data.requireCostCenter ?? DEFAULTS.requireCostCenter,
        requireProject: data.requireProject ?? DEFAULTS.requireProject,
        requireContact: data.requireContact ?? DEFAULTS.requireContact,
        requireTag: data.requireTag ?? DEFAULTS.requireTag,
        requireSubcategory: data.requireSubcategory ?? DEFAULTS.requireSubcategory,
        installmentDefault: data.installmentDefault ?? DEFAULTS.installmentDefault,
      })
    } catch { setError('Erro ao carregar configurações.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true); setError(null); setSuccess(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      setSuccess(true)
    } catch { setError('Erro ao salvar configurações.') }
    finally { setSaving(false) }
  }

  const update = (key: keyof Settings, value: any) => setSettings(s => ({ ...s, [key]: value }))

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Configurações do Sistema</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Configurações salvas com sucesso!</Alert>}

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Campos Obrigatórios</Typography>
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={settings.requireCostCenter} onChange={e => update('requireCostCenter', e.target.checked)} />}
              label="Exigir Centro de Custo em lançamentos"
            />
            <FormControlLabel
              control={<Switch checked={settings.requireProject} onChange={e => update('requireProject', e.target.checked)} />}
              label="Exigir Projeto em lançamentos"
            />
            <FormControlLabel
              control={<Switch checked={settings.requireContact} onChange={e => update('requireContact', e.target.checked)} />}
              label="Exigir Contato em lançamentos"
            />
            <FormControlLabel
              control={<Switch checked={settings.requireTag} onChange={e => update('requireTag', e.target.checked)} />}
              label="Exigir Tag em lançamentos"
            />
            <FormControlLabel
              control={<Switch checked={settings.requireSubcategory} onChange={e => update('requireSubcategory', e.target.checked)} />}
              label="Exigir Subcategoria em lançamentos"
            />
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Data de Competência</Typography>
          <FormControlLabel
            control={<Switch checked={settings.enableCompetenceDate} onChange={e => update('enableCompetenceDate', e.target.checked)} />}
            label="Habilitar campo de data de competência em lançamentos"
          />
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Parcelamentos</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>Padrão de parcelamento</InputLabel>
            <Select
              value={settings.installmentDefault}
              onChange={e => update('installmentDefault', e.target.value)}
              label="Padrão de parcelamento"
            >
              <MenuItem value="VALOR_PARCELA">Valor da Parcela</MenuItem>
              <MenuItem value="VALOR_TOTAL">Valor Total</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        <Divider />

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button onClick={load}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
