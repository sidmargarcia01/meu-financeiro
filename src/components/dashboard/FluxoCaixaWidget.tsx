/**
 * CAMADA: Componentes UI
 * MÓDULO: Dashboard - Widget Fluxo de Caixa
 * RESPONSABILIDADE: Exibir gráfico de fluxo de caixa
 * NÃO DEVE: Conter lógica de negócio, apenas apresentação
 * DEPENDE DE: useFluxoCaixa hook
 */

'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Button
} from '@mui/material'
import { 
  ShowChart, 
  MoreVert,
  Timeline,
  BarChart,
  Refresh
} from '@mui/icons-material'
import { useFluxoCaixa } from '@/hooks/dashboard'
import { formatCurrency } from '@/utils/formatCurrency'

interface FluxoCaixaWidgetProps {
  className?: string
}

export function FluxoCaixaWidget({ className }: FluxoCaixaWidgetProps) {
  const { data, loading, error, refetch } = useFluxoCaixa({ meses: 6 })
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [viewType, setViewType] = useState<'saldo' | 'fluxo'>('saldo')

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: 'saldo' | 'fluxo'
  ) => {
    if (newView !== null) {
      setViewType(newView)
    }
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
            <Typography color="error">
              Nenhum dado de fluxo de caixa encontrado
            </Typography>
          </Box>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getMaxValue = () => {
    if (viewType === 'saldo') {
      return Math.max(...data.map(d => Math.abs(d.acumulado)), 1)
    } else {
      return Math.max(...data.map(d => Math.max(d.receitas, d.despesas)), 1)
    }
  }

  const maxValue = getMaxValue()

  // Componente de gráfico simplificado
  const SimpleChart = () => (
    <Box height={200} position="relative" px={2}>
      {/* Linha do zero */}
      <Box
        position="absolute"
        left={0}
        right={0}
        top="50%"
        height={1}
        bgcolor="grey.300"
      />
      
      {/* Barras do gráfico */}
      <Box display="flex" height="100%" alignItems="center" justifyContent="space-around">
        {data.map((item, index) => {
          const value = viewType === 'saldo' ? item.acumulado : item.saldo
          const heightPercent = Math.abs(value) / maxValue * 80
          const isPositive = value >= 0
          
          return (
            <Box key={index} display="flex" flexDirection="column" alignItems="center" flex={1}>
              <Box
                width={30}
                height={`${heightPercent}%`}
                bgcolor={isPositive ? 'success.main' : 'error.main'}
                borderRadius={2}
                position="relative"
                sx={{
                  alignSelf: viewType === 'saldo' 
                    ? (isPositive ? 'flex-end' : 'flex-start')
                    : 'flex-end',
                  mb: viewType === 'saldo' && isPositive ? 1 : 0,
                  mt: viewType === 'saldo' && !isPositive ? 1 : 0
                }}
              >
                {/* Tooltip simplificado */}
                <Box
                  position="absolute"
                  top={isPositive ? -30 : 'auto'}
                  bottom={!isPositive ? -30 : 'auto'}
                  left={0}
                  right={0}
                  textAlign="center"
                >
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(value)}
                  </Typography>
                </Box>
              </Box>
              
              {/* Label do mês */}
              <Typography variant="caption" color="text.secondary" mt={1}>
                {item.mes.slice(0, 3)}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </Box>
  )

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <ShowChart color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Fluxo de Caixa
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </Box>

        {/* Toggle de visualização */}
        <Box display="flex" justifyContent="center" mb={2}>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="saldo">
              <Timeline sx={{ fontSize: 16, mr: 0.5 }} />
              Saldo
            </ToggleButton>
            <ToggleButton value="fluxo">
              <BarChart sx={{ fontSize: 16, mr: 0.5 }} />
              Fluxo
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Gráfico */}
        <SimpleChart />

        {/* Resumo dos valores */}
        <Box mt={3}>
          <Box display="flex" gap={2}>
            <Box flex="1" textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Total Receitas
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatCurrency(data.reduce((sum, d) => sum + d.receitas, 0))}
              </Typography>
            </Box>
            <Box flex="1" textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Total Despesas
              </Typography>
              <Typography variant="h6" color="error.main">
                {formatCurrency(data.reduce((sum, d) => sum + d.despesas, 0))}
              </Typography>
            </Box>
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
