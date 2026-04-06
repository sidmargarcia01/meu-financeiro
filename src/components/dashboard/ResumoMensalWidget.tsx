/**
 * CAMADA: Componentes UI
 * MÓDULO: Dashboard - Widget Resumo Mensal
 * RESPONSABILIDADE: Exibir resumo financeiro do mês
 * NÃO DEVE: Conter lógica de negócio, apenas apresentação
 * DEPENDE DE: useResumoMensal hook
 */

'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button
} from '@mui/material'
import { 
  Assessment, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Refresh
} from '@mui/icons-material'
import { useResumoMensal } from '@/hooks/dashboard'
import { formatCurrency } from '@/utils/formatCurrency'
import { formatMonthYear } from '@/utils/formatDate'

interface ResumoMensalWidgetProps {
  className?: string
}

export function ResumoMensalWidget({ className }: ResumoMensalWidgetProps) {
  const { data, loading, error, refetch } = useResumoMensal()
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
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
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

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  const hoje = new Date()
  const mes = hoje.getMonth() + 1
  const ano = hoje.getFullYear()

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Assessment color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Resumo Mensal
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>

        <Typography variant="subtitle2" color="text.secondary" mb={2}>
          {formatMonthYear(data.mes, data.ano)}
        </Typography>

        {/* Valores principais */}
        <Box display="flex" gap={2} mb={3}>
          <Box flex="1" textAlign="center">
            <Typography variant="h6" color="success.main" fontWeight="bold">
              {formatCurrency(data.receitas)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Receitas
            </Typography>
          </Box>
          <Box flex="1" textAlign="center">
            <Typography variant="h6" color="error.main" fontWeight="bold">
              {formatCurrency(data.despesas)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Despesas
            </Typography>
          </Box>
          <Box flex="1" textAlign="center">
            <Typography 
              variant="h6" 
              color={data.saldo >= 0 ? 'primary.main' : 'error.main'} 
              fontWeight="bold"
            >
              {formatCurrency(data.saldo)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Saldo
            </Typography>
          </Box>
        </Box>

        {/* Comparativo com mês anterior */}
        {data.comparativo_mes_anterior && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Comparativo com mês anterior
            </Typography>
            
            <Box display="flex" gap={2}>
              <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                {data.comparativo_mes_anterior.variacao_receitas_percent >= 0 ? (
                  <ArrowUpward color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                ) : (
                  <ArrowDownward color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={data.comparativo_mes_anterior.variacao_receitas_percent >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(data.comparativo_mes_anterior.variacao_receitas_percent)}
                </Typography>
              </Box>
              <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                {data.comparativo_mes_anterior.variacao_despesas_percent >= 0 ? (
                  <ArrowUpward color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                ) : (
                  <ArrowDownward color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={data.comparativo_mes_anterior.variacao_despesas_percent >= 0 ? 'error.main' : 'success.main'}
                >
                  {formatPercent(data.comparativo_mes_anterior.variacao_despesas_percent)}
                </Typography>
              </Box>
              <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                {data.comparativo_mes_anterior.variacao_saldo_percent >= 0 ? (
                  <ArrowUpward color="success" sx={{ fontSize: 16, mr: 0.5 }} />
                ) : (
                  <ArrowDownward color="error" sx={{ fontSize: 16, mr: 0.5 }} />
                )}
                <Typography 
                  variant="body2" 
                  color={data.comparativo_mes_anterior.variacao_saldo_percent >= 0 ? 'success.main' : 'error.main'}
                >
                  {formatPercent(data.comparativo_mes_anterior.variacao_saldo_percent)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Indicador de saúde financeira */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Saúde Financeira
          </Typography>
          <Box display="flex" alignItems="center">
            <Box flex={1} mr={2}>
              <Box 
                height={8} 
                bgcolor={data.saldo >= 0 ? 'success.main' : 'error.main'}
                borderRadius={4}
                sx={{
                  width: `${Math.min(Math.abs(data.saldo / Math.max(data.receitas, 1)) * 100, 100)}%`
                }}
              />
            </Box>
            <Chip 
              label={data.saldo >= 0 ? 'Positivo' : 'Negativo'} 
              color={data.saldo >= 0 ? 'success' : 'error'}
              size="small"
            />
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
