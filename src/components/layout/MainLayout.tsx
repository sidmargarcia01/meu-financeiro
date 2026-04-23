/**
 * CAMADA: Component
 * MODULO: Layout
 * RESPONSABILIDADE: Compor Sidebar + Header + area de conteudo em layout SPA fixo
 *                   conforme documentado no relatorio de engenharia reversa
 * NAO DEVE: Conter logica de negocio, fazer fetch de dados financeiros
 * DEPENDE DE: Sidebar, Header, QueryClientProvider
 */

'use client'

import { useState } from 'react'
import { Box, Toolbar } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
})

interface MainLayoutProps {
  children: React.ReactNode
  userName: string
  userEmail: string
}

export function MainLayout({ children, userName, userEmail }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <QueryClientProvider client={queryClient}>
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
        {/* Sidebar como Drawer temporário - oculto por padrão */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Area de conteudo dinamica a direita */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header fixo no topo */}
          <Header
            userName={userName}
            userEmail={userEmail}
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Espacador para compensar o AppBar fixo */}
          <Toolbar />

          {/* Conteudo da pagina atual */}
          <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
            {children}
          </Box>
        </Box>
      </Box>
    </QueryClientProvider>
  )
}
