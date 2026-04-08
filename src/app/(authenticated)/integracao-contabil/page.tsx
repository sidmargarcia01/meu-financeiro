/**
 * 📄 Descrição: Integração Contábil — exportação e sincronização
 * 🧱 Contexto: Módulo 10 — rota /integracao-contabil
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: Next.js App Router, React, Material-UI
 * ✅ Revisado: Sim
 */

'use client'

import { useState } from 'react'
import {
  Box, Typography, Paper, Stack, Button, Alert, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, TextField, Chip,
  LinearProgress, IconButton, Tooltip,
} from '@mui/material'
import { CloudUpload, Sync, FileDownload, Settings } from '@mui/icons-material'
import { formatCurrency } from '@/utils/formatCurrency'

interface Sistema {
  id: string; nome: string; status: 'CONECTADO' | 'DESCONECTADO'; ultimaSincronizacao?: string
}

interface Exportacao {
  id: string; tipo: string; periodo: string; status: 'CONCLUIDO' | 'PROCESSANDO' | 'ERRO'
  data?: string; tamanho?: string
}

export default function IntegracaoContabilPage() {
  const [sistemas, setSistemas] = useState<Sistema[]>([
    { id: '1', nome: 'Contábil Online', status: 'CONECTADO', ultimaSincronizacao: '2026-04-07 08:30' },
    { id: '2', nome: 'Sage Contábil', status: 'DESCONECTADO' },
  ])
  const [exportacoes, setExportacoes] = useState<Exportacao[]>([
    { id: '1', tipo: 'Plano de Contas', periodo: '2026/04', status: 'CONCLUIDO', data: '2026-04-07 08:15', tamanho: '2.3 KB' },
    { id: '2', tipo: 'Lançamentos', periodo: '2026/03', status: 'PROCESSANDO' },
    { id: '3', tipo: 'DRE', periodo: '2026/03', status: 'ERRO' },
  ])
  const [selectedSystem, setSelectedSystem] = useState('')
  const [exportType, setExportType] = useState('')
  const [period, setPeriod] = useState('')

  const handleConnect = (id: string) => {
    setSistemas(ss => ss.map(s => s.id === id ? { ...s, status: 'CONECTADO' as const, ultimaSincronizacao: new Date().toLocaleString('pt-BR') } : s))
  }

  const handleDisconnect = (id: string) => {
    setSistemas(ss => ss.map(s => s.id === id ? { ...s, status: 'DESCONECTADO' as const, ultimaSincronizacao: undefined } : s))
  }

  const handleSync = (id: string) => {
    setSistemas(ss => ss.map(s => s.id === id ? { ...s, ultimaSincronizacao: new Date().toLocaleString('pt-BR') } : s))
  }

  const handleExport = () => {
    if (!selectedSystem || !exportType || !period) return
    const newExport: Exportacao = {
      id: crypto.randomUUID(),
      tipo: exportType,
      periodo: period,
      status: 'PROCESSANDO',
    }
    setExportacoes(es => [newExport, ...es])
    setTimeout(() => {
      setExportacoes(es => es.map(e => e.id === newExport.id
        ? { ...e, status: 'CONCLUIDO' as const, data: new Date().toLocaleString('pt-BR'), tamanho: '1.8 KB' }
        : e))
    }, 3000)
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'CONECTADO': case 'CONCLUIDO': return 'success'
      case 'DESCONECTADO': return 'default'
      case 'PROCESSANDO': return 'warning'
      case 'ERRO': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Integração Contábil</Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Sistemas Conectados</Typography>
          <Stack spacing={2}>
            {sistemas.map(s => (
              <Card key={s.id} variant="outlined">
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{s.nome}</Typography>
                      {s.ultimaSincronizacao && (
                        <Typography variant="caption" color="text.secondary">
                          Última sincronização: {s.ultimaSincronizacao}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={s.status} size="small" color={statusColor(s.status)} />
                      {s.status === 'CONECTADO' ? (
                        <>
                          <Tooltip title="Sincronizar">
                            <IconButton size="small" onClick={() => handleSync(s.id)}><Sync fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Desconectar">
                            <IconButton size="small" color="error" onClick={() => handleDisconnect(s.id)}><Settings fontSize="small" /></IconButton>
                          </Tooltip>
                        </>
                      ) : (
                        <Button size="small" onClick={() => handleConnect(s.id)}>Conectar</Button>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Exportar Dados</Typography>
          <Stack spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Sistema</InputLabel>
              <Select value={selectedSystem} onChange={e => setSelectedSystem(e.target.value)} label="Sistema">
                {sistemas.filter(s => s.status === 'CONECTADO').map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Tipo de Exportação</InputLabel>
              <Select value={exportType} onChange={e => setExportType(e.target.value)} label="Tipo de Exportação">
                <MenuItem value="plano-contas">Plano de Contas</MenuItem>
                <MenuItem value="lancamentos">Lançamentos</MenuItem>
                <MenuItem value="dre">DRE</MenuItem>
                <MenuItem value="dfc">DFC</MenuItem>
                <MenuItem value="balanco">Balanço Patrimonial</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Período (AAAA/MM)"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              size="small"
              placeholder="2026/04"
              fullWidth
            />
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={handleExport}
              disabled={!selectedSystem || !exportType || !period}
              fullWidth
            >
              Exportar
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} mb={2}>Histórico de Exportações</Typography>
          <Stack spacing={2}>
            {exportacoes.length === 0 ? (
              <Typography color="text.secondary" align="center" py={3}>Nenhuma exportação realizada.</Typography>
            ) : (
              exportacoes.map(e => (
                <Card key={e.id} variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{e.tipo}</Typography>
                        <Typography variant="caption" color="text.secondary">Período: {e.periodo}</Typography>
                        {e.data && <Typography variant="caption" color="text.secondary" display="block">{e.data}</Typography>}
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {e.tamanho && <Typography variant="caption" color="text.secondary">{e.tamanho}</Typography>}
                        <Chip label={e.status} size="small" color={statusColor(e.status)} />
                        {e.status === 'CONCLUIDO' && (
                          <Tooltip title="Baixar arquivo">
                            <IconButton size="small"><FileDownload fontSize="small" /></IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Stack>
                    {e.status === 'PROCESSANDO' && (
                      <Box mt={1}>
                        <LinearProgress variant="indeterminate" sx={{ height: 4, borderRadius: 2 }} />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  )
}
