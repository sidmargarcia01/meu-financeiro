/**
 * CAMADA: Componentes UI
 * MÓDULO: Dashboard - Widget Saldo Consolidado
 * RESPONSABILIDADE: Exibir saldo consolidado das contas
 * NÃO DEVE: Conter lógica de negócio, apenas apresentação
 * DEPENDE DE: useSaldoConsolidado hook
 */

'use client'

import { Card, CardContent, Typography, Box, CircularProgress, Button } from '@mui/material'
import { AccountBalance, TrendingUp, TrendingDown, Refresh } from '@mui/icons-material'
import { useSaldoConsolidado } from '@/hooks/dashboard'
import { formatCurrency } from '@/utils/formatCurrency'

interface SaldoConsolidadoWidgetProps {
  className?: string
}

export function SaldoConsolidadoWidget({ className }: SaldoConsolidadoWidgetProps) {
  const { data, loading, error, refetch } = useSaldoConsolidado()

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

  return (
    <Card className={className}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <AccountBalance color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" component="h2">
              Saldo Total
            </Typography>
          </Box>
        </Box>

        <Box mb={3}>
          <Typography variant="h4" component="div" color="primary" fontWeight="bold">
            {formatCurrency(data.total_projetado)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saldo Projetado
          </Typography>
        </Box>

        <Box mb={2}>
          <Typography variant="h5" component="div" color={data.total_confirmado >= 0 ? 'success.main' : 'error.main'}>
            {formatCurrency(data.total_confirmado)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Saldo Confirmado
          </Typography>
        </Box>

        {/* Lista de contas */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Por Conta
          </Typography>
          {data.por_conta.map((conta) => (
            <Box key={conta.account_id} display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                {conta.account_name}
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatCurrency(conta.confirmado)}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Indicador de variação */}
        {data.total_projetado !== data.total_confirmado && (
          <Box mt={2} display="flex" alignItems="center">
            {data.total_projetado > data.total_confirmado ? (
              <TrendingUp color="success" sx={{ mr: 1 }} />
            ) : (
              <TrendingDown color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" color="text.secondary">
              {formatCurrency(Math.abs(data.total_projetado - data.total_confirmado))} 
              {' '}a confirmar
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
