/**
 * CAMADA: Component
 * MODULO: Layout - Header
 * RESPONSABILIDADE: Renderizar a barra de topo com busca, alertas e perfil
 *                   conforme especificado nos documentos de analise do sistema original
 * NAO DEVE: Conter logica de negocio, calcular alertas, acessar banco diretamente
 * DEPENDE DE: useAlerts hook, Material-UI, next/navigation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AppBar,
  Toolbar,
  InputBase,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Box,
  Typography,
  Divider,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  Popover,
} from '@mui/material'
import {
  Search as SearchIcon,
  AccountBalance as BankIcon,
  Notifications as AlertIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
} from '@mui/icons-material'
import { useAlerts } from '@/hooks/useAlerts'
import { formatCurrency } from '@/utils/formatCurrency'

interface HeaderProps {
  userName: string
  userEmail: string
  onLogout: () => void
}

export function Header({ userName, userEmail, onLogout }: HeaderProps) {
  const router = useRouter()
  const { data: alertsData } = useAlerts()

  const [searchValue, setSearchValue] = useState('')
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null)
  const [alertsAnchor, setAlertsAnchor] = useState<null | HTMLElement>(null)

  const totalAlertas = alertsData?.total ?? 0
  const temAlertas = totalAlertas > 0

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      router.push(`/movimentacoes/extrato?busca=${encodeURIComponent(searchValue)}`)
    }
  }

  return (
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
      <Toolbar sx={{ gap: 2 }}>
        {/* BUSCA GLOBAL — pesquisa lancamentos conforme documentos */}
        <Box
          component="form"
          onSubmit={handleSearch}
          sx={{
            flex: 1,
            maxWidth: 480,
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'grey.100',
            borderRadius: 2,
            px: 2,
            py: 0.5,
          }}
        >
          <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
          <InputBase
            placeholder="Buscar lancamentos..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            sx={{ flex: 1, fontSize: 14 }}
            inputProps={{ 'aria-label': 'buscar lancamentos' }}
          />
        </Box>

        <Box flex={1} />

        {/* INTEGRACAO BANCARIA — icone de banco conforme documentos */}
        <Tooltip title="Conexoes bancarias">
          <IconButton onClick={() => router.push('/ferramentas/conexoes')} size="small">
            <BankIcon />
          </IconButton>
        </Tooltip>

        {/* ALERTAS DE VENCIMENTO — pop-ups vermelhos conforme documentos */}
        <Tooltip title={temAlertas ? `${totalAlertas} alerta(s) de vencimento` : 'Sem alertas'}>
          <IconButton size="small" onClick={(e) => setAlertsAnchor(e.currentTarget)}>
            <Badge badgeContent={totalAlertas} color="error" max={99}>
              <AlertIcon color={temAlertas ? 'error' : 'inherit'} />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Popover de alertas */}
        <Popover
          open={Boolean(alertsAnchor)}
          anchorEl={alertsAnchor}
          onClose={() => setAlertsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { width: 340, maxHeight: 400 } }}
        >
          <Box px={2} py={1.5} display="flex" alignItems="center" gap={1}>
            <WarningIcon color="error" fontSize="small" />
            <Typography variant="subtitle2" fontWeight={600}>
              Alertas de Vencimento
            </Typography>
          </Box>
          <Divider />
          {totalAlertas === 0 ? (
            <Box px={2} py={3} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Nenhum alerta no momento
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ maxHeight: 300, overflowY: 'auto' }}>
              {alertsData?.vencidos?.map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemText
                    primary={alert.description}
                    secondary={`${formatCurrency(alert.amount)} · vencido ha ${alert.days_overdue}d`}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ color: 'error', fontSize: 12 }}
                  />
                </ListItem>
              ))}
              {alertsData?.vence_hoje?.map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemText
                    primary={alert.description}
                    secondary={`${formatCurrency(alert.amount)} · vence hoje`}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ color: 'warning.main', fontSize: 12 }}
                  />
                </ListItem>
              ))}
              {alertsData?.vence_amanha?.map((alert) => (
                <ListItem key={alert.id} divider>
                  <ListItemText
                    primary={alert.description}
                    secondary={`${formatCurrency(alert.amount)} · vence amanha`}
                    primaryTypographyProps={{ fontSize: 13 }}
                    secondaryTypographyProps={{ fontSize: 12 }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          <Divider />
          <Box px={2} py={1}>
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                setAlertsAnchor(null)
                router.push('/movimentacoes/extrato?status=PENDENTE')
              }}
            >
              Ver todos os lancamentos pendentes &rarr;
            </Typography>
          </Box>
        </Popover>

        {/* PERFIL DO USUARIO — troca de conta e configuracoes conforme documentos */}
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{
            cursor: 'pointer',
            borderRadius: 2,
            px: 1,
            py: 0.5,
            '&:hover': { bgcolor: 'grey.100' },
          }}
          onClick={(e) => setProfileAnchor(e.currentTarget)}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {userName?.charAt(0)?.toUpperCase() ?? 'U'}
          </Avatar>
          <Typography
            variant="body2"
            fontWeight={500}
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {userName}
          </Typography>
        </Box>

        <Menu
          anchorEl={profileAnchor}
          open={Boolean(profileAnchor)}
          onClose={() => setProfileAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box px={2} py={1}>
            <Typography variant="body2" fontWeight={600}>{userName}</Typography>
            <Typography variant="caption" color="text.secondary">{userEmail}</Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setProfileAnchor(null)
              router.push('/configuracoes')
            }}
          >
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Configuracoes
          </MenuItem>
          <MenuItem onClick={onLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  )
}
