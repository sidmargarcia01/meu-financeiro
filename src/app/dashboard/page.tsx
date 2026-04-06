/**
 * CAMADA: Pages
 * MODULO: Dashboard
 * RESPONSABILIDADE: Dashboard principal com widgets financeiros
 * NAO DEVE: Conter logica de API, apenas apresentacao
 * DEPENDE DE: React, Next.js, Material-UI, Dashboard Widgets
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { 
  Box, 
  Container, 
  Typography,
  IconButton,
  Toolbar,
  AppBar,
  Alert
} from "@mui/material"
import { 
  Visibility, 
  VisibilityOff, 
  Logout,
  Refresh
} from "@mui/icons-material"
import { 
  SaldoConsolidadoWidget,
  ResumoMensalWidget,
  FluxoCaixaWidget,
  LancamentosProximosWidget,
  CategoriasWidget
} from "@/components/dashboard"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000,
      refetchOnWindowFocus: true
    }
  }
})

export default function DashboardPage() {
  const router = useRouter()
  const { session, signOut } = useSupabaseAuth()
  const [showBalances, setShowBalances] = useState(true)

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!session) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="info">Carregando...</Alert>
      </Container>
    )
  }

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  return (
    <QueryClientProvider client={queryClient}>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="default" elevation={1}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Dashboard — Meu Financeiro
            </Typography>
            <IconButton color="inherit" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <VisibilityOff /> : <Visibility />}
            </IconButton>
            <IconButton color="inherit" onClick={handleRefresh}>
              <Refresh />
            </IconButton>
            <IconButton color="inherit" onClick={handleLogout}>
              <Logout />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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
                sx={{ border: "2px dashed", borderColor: "grey.300", borderRadius: 2, bgcolor: "grey.50" }}
              >
                <Typography variant="h6" color="text.secondary" textAlign="center">
                  Mais widgets em breve...
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </QueryClientProvider>
  )
}
