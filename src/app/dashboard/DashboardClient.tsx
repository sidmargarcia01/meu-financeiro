'use client'

import { useRouter } from 'next/navigation'
import { Box, CircularProgress, Container, Typography } from '@mui/material'
import {
  SaldoConsolidadoWidget,
  ResumoMensalWidget,
  FluxoCaixaWidget,
  LancamentosProximosWidget,
  CategoriasWidget,
} from '@/components/dashboard'
import { MainLayout } from '@/components/layout/MainLayout'
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth'

export default function DashboardClient() {
  const router = useRouter()
  const { session, loading } = useSupabaseAuth()

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Carregando...</Typography>
      </Container>
    )
  }

  if (!session) {
    router.push('/login')
    return null
  }

  const userName =
    session.user?.user_metadata?.name ??
    session.user?.email?.split('@')[0] ??
    'Usuario'
  const userEmail = session.user?.email ?? ''
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <MainLayout userName={userName} userEmail={userEmail}>
      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        <Box flex="1" minWidth={300}>
          <SaldoConsolidadoWidget />
        </Box>
        <Box flex="1" minWidth={300}>
          <ResumoMensalWidget />
        </Box>
        <Box flex="1" minWidth={300}>
          <FluxoCaixaWidget />
        </Box>
        <Box flex="1" minWidth={300}>
          <LancamentosProximosWidget />
        </Box>
      </Box>

      <Box display="flex" gap={3}>
        <Box flex="1" minWidth={400}>
          <CategoriasWidget mes={currentMonth} ano={currentYear} />
        </Box>
        <Box flex="1" minWidth={400}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            minHeight={300}
            sx={{ border: '2px dashed', borderColor: 'grey.300', borderRadius: 2, bgcolor: 'grey.50' }}
          >
            <Typography variant="h6" color="text.secondary" textAlign="center">
              Mais widgets em breve...
            </Typography>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  )
}
