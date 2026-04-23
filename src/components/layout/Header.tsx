/**
 * 📄 Descrição: Barra de topo com 4 elementos exatos dos documentos
 * 🧱 Contexto: Renderizado no MainLayout para todas as rotas autenticadas
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Material-UI, Next.js
 * 🔍 Dependências: useAlerts, useSearch, SearchModal, formatCurrency
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Header
 * RESPONSABILIDADE: Barra de topo com os 4 elementos exatos dos documentos:
 *   1. Busca Global (CTRL+K)  2. Integração Bancária (Pluggy)
 *   3. Notificações/Alertas (pop-ups vermelhos)  4. Perfil do Usuário
 * NÃO DEVE: Calcular alertas, fazer fetch direto, conter lógica de negócio
 * DEPENDE DE: useAlerts, useSearch, SearchModal, formatCurrency, next/navigation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AppBar, Toolbar, IconButton, Badge, Menu, MenuItem,
  Box, Typography, Divider, Avatar, Tooltip,
  List, ListItem, ListItemText, Popover, Chip,
} from '@mui/material'
import {
  Search as SearchIcon,
  AccountBalance as BankIcon,
  Notifications as AlertIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Menu as MenuIcon,
} from '@mui/icons-material'
import { useAlerts } from '@/hooks/useAlerts'
import { useSearch } from '@/hooks/useSearch'
import { SearchModal } from './SearchModal'
import { formatCurrency } from '@/utils/formatCurrency'

interface HeaderProps {
  userName: string
  userEmail: string
  onMenuClick?: () => void
}

export function Header({ userName, userEmail, onMenuClick }: HeaderProps) {
  const router = useRouter()
  const { data: alertsData } = useAlerts()
  const { setIsOpen: openSearch } = useSearch()

  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [alertsAnchor, setAlertsAnchor] = useState<null | HTMLElement>(null)

  const totalAlertas = alertsData?.total ?? 0
  const temAlertas = totalAlertas > 0

  const handleLogout = async () => {
    setProfileAnchor(null)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {/* Modal de busca — ativado por CTRL+K conforme documentado */}
      <SearchModal />

      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ gap: 1.5, minHeight: '64px !important' }}>

          {/* Botão de menu hambúrguer para abrir o Drawer lateral */}
          <Tooltip title="Abrir menu">
            <IconButton size="small" onClick={onMenuClick} sx={{ color: 'text.secondary' }}>
              <MenuIcon />
            </IconButton>
          </Tooltip>

          {/* ELEMENTO 1: Busca Global — "atalho CTRL+K" documentado */}
          <Box
            onClick={() => openSearch(true)}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{
              flex: 1,
              maxWidth: 420,
              bgcolor: 'grey.100',
              borderRadius: 2,
              px: 2,
              py: 0.75,
              cursor: 'pointer',
              border: '1px solid transparent',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' },
              transition: 'all 0.15s',
            }}
          >
            <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, userSelect: 'none' }}>
              Buscar lançamentos...
            </Typography>
            <Chip
              label="CTRL+K"
              size="small"
              sx={{ height: 20, fontSize: 10, bgcolor: 'grey.200', color: 'text.secondary' }}
            />
          </Box>

          <Box flex={1} />

          {/* ELEMENTO 2: Integração Bancária — "ícone de banco para gerenciar conexões (Pluggy)" */}
          <Tooltip title="Conexões bancárias (Pluggy)">
            <IconButton size="small" onClick={() => router.push('/ferramentas/conexoes')} sx={{ color: 'text.secondary' }}>
              <BankIcon />
            </IconButton>
          </Tooltip>

          {/* ELEMENTO 3: Alertas — "pop-ups vermelhos no canto superior direito" */}
          <Tooltip title={temAlertas ? `${totalAlertas} alerta(s) de vencimento` : 'Sem alertas de vencimento'}>
            <IconButton
              size="small"
              onClick={(e) => setAlertsAnchor(e.currentTarget)}
              sx={{ color: temAlertas ? 'error.main' : 'text.secondary' }}
            >
              <Badge badgeContent={totalAlertas} color="error" max={99}>
                <AlertIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Popover
            open={Boolean(alertsAnchor)}
            anchorEl={alertsAnchor}
            onClose={() => setAlertsAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { width: 360, maxHeight: 440, mt: 0.5 } }}
          >
            <Box
              px={2} py={1.5} display="flex" alignItems="center" gap={1}
              bgcolor={temAlertas ? 'error.50' : 'background.paper'}
            >
              <WarningIcon color={temAlertas ? 'error' : 'disabled'} fontSize="small" />
              <Typography variant="subtitle2" fontWeight={600}>Alertas de Vencimento</Typography>
              {temAlertas && (
                <Chip label={totalAlertas} color="error" size="small" sx={{ ml: 'auto', height: 20, fontSize: 11 }} />
              )}
            </Box>
            <Divider />
            {totalAlertas === 0 ? (
              <Box px={2} py={4} textAlign="center">
                <Typography variant="body2" color="text.secondary">Nenhum alerta no momento</Typography>
                <Typography variant="caption" color="text.disabled">Seus lançamentos estão em dia</Typography>
              </Box>
            ) : (
              <List dense sx={{ maxHeight: 300, overflowY: 'auto', py: 0 }}>
                {(alertsData?.vencidos?.length ?? 0) > 0 && (
                  <>
                    <Box px={2} py={0.5} bgcolor="error.50">
                      <Typography variant="caption" color="error" fontWeight={600}>
                        VENCIDOS ({alertsData?.vencidos?.length})
                      </Typography>
                    </Box>
                    {alertsData?.vencidos?.map((alert: { id: string; description: string; amount: number; days_overdue?: number }) => (
                      <ListItem key={alert.id} divider sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={alert.description}
                          secondary={`${formatCurrency(alert.amount)} · vencido há ${alert.days_overdue}d`}
                          primaryTypographyProps={{ fontSize: 13 }}
                          secondaryTypographyProps={{ color: 'error.main', fontSize: 12, fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                  </>
                )}
                {(alertsData?.vence_hoje?.length ?? 0) > 0 && (
                  <>
                    <Box px={2} py={0.5} bgcolor="warning.50">
                      <Typography variant="caption" color="warning.dark" fontWeight={600}>
                        VENCE HOJE ({alertsData?.vence_hoje?.length})
                      </Typography>
                    </Box>
                    {alertsData?.vence_hoje?.map((alert: { id: string; description: string; amount: number }) => (
                      <ListItem key={alert.id} divider sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={alert.description}
                          secondary={`${formatCurrency(alert.amount)} · vence hoje`}
                          primaryTypographyProps={{ fontSize: 13 }}
                          secondaryTypographyProps={{ color: 'warning.dark', fontSize: 12, fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                  </>
                )}
                {(alertsData?.vence_amanha?.length ?? 0) > 0 && (
                  <>
                    <Box px={2} py={0.5}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        VENCE AMANHÃ ({alertsData?.vence_amanha?.length})
                      </Typography>
                    </Box>
                    {alertsData?.vence_amanha?.map((alert: { id: string; description: string; amount: number }) => (
                      <ListItem key={alert.id} divider sx={{ py: 0.75 }}>
                        <ListItemText
                          primary={alert.description}
                          secondary={`${formatCurrency(alert.amount)} · vence amanhã`}
                          primaryTypographyProps={{ fontSize: 13 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            )}
            <Divider />
            <Box px={2} py={1}>
              <Typography
                variant="caption" color="primary.main"
                sx={{ cursor: 'pointer', fontWeight: 500 }}
                onClick={() => { setAlertsAnchor(null); router.push('/movimentacoes/a-pagar') }}
              >
                Ver todos os lançamentos pendentes →
              </Typography>
            </Box>
          </Popover>

          {/* ELEMENTO 4: Perfil — "troca de conta/empresa e configurações" */}
          <Box
            display="flex" alignItems="center" gap={1}
            onClick={(e) => setProfileAnchor(e.currentTarget)}
            sx={{
              cursor: 'pointer', borderRadius: 2, px: 1.5, py: 0.5,
              '&:hover': { bgcolor: 'grey.100' }, transition: 'background 0.15s',
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14, fontWeight: 600 }}>
              {userName?.charAt(0)?.toUpperCase() ?? 'U'}
            </Avatar>
            <Typography variant="body2" fontWeight={500} sx={{ display: { xs: 'none', md: 'block' } }}>
              {userName}
            </Typography>
          </Box>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{ sx: { minWidth: 220, mt: 0.5 } }}
          >
            <Box px={2} py={1.5}>
              <Typography variant="body2" fontWeight={600}>{userName}</Typography>
              <Typography variant="caption" color="text.secondary">{userEmail}</Typography>
            </Box>
            <Divider />
            <MenuItem onClick={() => { setProfileAnchor(null); router.push('/ferramentas/configuracoes') }}>
              <SettingsIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
              Configurações
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
              Sair
            </MenuItem>
          </Menu>

        </Toolbar>
      </AppBar>
    </>
  )
}
