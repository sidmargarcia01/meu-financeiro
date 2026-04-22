/**
 * CAMADA: Componentes UI
 * MÓDULO: Dashboard - Widget Lançamentos Próximos
 * RESPONSABILIDADE: Exibir lista de lançamentos próximos ao vencimento
 * NÃO DEVE: Conter lógica de negócio, apenas apresentação
 * DEPENDE DE: useLancamentosProximos hook
 */

'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Alert,
  Button
} from '@mui/material'
import {
  Event,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  Warning,
  Schedule,
  Refresh
} from '@mui/icons-material'
import { useLancamentosProximos } from '@/hooks/dashboard'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatDate, getDaysFromToday, formatRelativeDayLabel } from '@/utils/formatDate'

interface LancamentosProximosWidgetProps {
  className?: string
}

export function LancamentosProximosWidget({ className }: LancamentosProximosWidgetProps) {
  const { data, loading, error, refetch } = useLancamentosProximos()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" flexDirection="column" alignItems="center" gap={2} py={2}>
            <Typography color="error" variant="body2">
              Não foi possível carregar os dados.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => refetch()}
              startIcon={<Refresh />}
            >
              Tentar novamente
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }


  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}>
            <Alert severity="info">
              Nenhum lançamento próximo encontrado
            </Alert>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const getUrgencyColor = (daysUntilDue: number, isOverdue: boolean) => {
    if (isOverdue) return 'error'
    if (daysUntilDue <= 3) return 'error'
    if (daysUntilDue <= 7) return 'warning'
    return 'default'
  }

  const getUrgencyLabel = (daysUntilDue: number, isOverdue: boolean) => {
    if (isOverdue) return 'Atrasado'
    if (daysUntilDue === 0) return 'Vence hoje'
    if (daysUntilDue === 1) return 'Vence amanhã'
    return `Em ${daysUntilDue} dias`
  }

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Event color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Lançamentos Próximos
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Alerta de lançamentos atrasados */}
        {data.some(l => l.is_overdue) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Você tem {data.filter(l => l.is_overdue).length} lançamento(s) atrasado(s)
          </Alert>
        )}

        {/* Lista de lançamentos */}
        <List sx={{ maxHeight: 350, overflow: 'auto' }}>
          {data.map((lancamento, index) => (
            <Box key={lancamento.id}>
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  {lancamento.type === 'RECEITA' ? (
                    <ArrowUpward color="success" />
                  ) : (
                    <ArrowDownward color="error" />
                  )}
                </ListItemIcon>

                <ListItemText
                  primary={
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body1" fontWeight="medium">
                        {lancamento.description}
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="bold"
                        color={lancamento.type === 'RECEITA' ? 'success.main' : 'error.main'}
                      >
                        {formatCurrency(lancamento.amount)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box mt={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {lancamento.account_name}
                          {lancamento.category_name && ` • ${lancamento.category_name}`}
                        </Typography>
                        <Chip
                          label={getUrgencyLabel(lancamento.days_until_due, lancamento.is_overdue)}
                          color={getUrgencyColor(lancamento.days_until_due, lancamento.is_overdue)}
                          size="small"
                          icon={lancamento.is_overdue ? <Warning /> : <Schedule />}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Vencimento: {formatDate(lancamento.due_date)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < data.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>

        {/* Resumo */}
        <Box mt={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Total a receber: {formatCurrency(data.filter(l => l.type === 'RECEITA').reduce((sum, l) => sum + l.amount, 0))}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total a pagar: {formatCurrency(data.filter(l => l.type === 'DESPESA').reduce((sum, l) => sum + l.amount, 0))}
            </Typography>
          </Box>
        </Box>

        {/* Menu de opções */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { refetch(); handleMenuClose(); }}>
            Atualizar
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}
