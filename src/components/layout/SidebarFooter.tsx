/**
 * 📄 Descrição: Rodapé da sidebar com alternância de tema claro/escuro
 * 🧱 Contexto: Renderizado no fundo do Drawer da Sidebar
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: useTheme
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Sidebar
 * RESPONSABILIDADE: Rodapé com alternância de tema claro/escuro — documentado no rodapé do menu
 * NÃO DEVE: Fazer fetch, conter lógica de negócio
 * DEPENDE DE: useTheme hook, Material-UI
 */

'use client'

import { Box, IconButton, Switch, Typography, Tooltip } from '@mui/material'
import { DarkMode as DarkIcon, LightMode as LightIcon } from '@mui/icons-material'
import { useTheme } from '@/hooks/useTheme'

interface SidebarFooterProps {
  isMinimized: boolean
}

export function SidebarFooter({ isMinimized }: SidebarFooterProps) {
  const { isDark, toggleTheme } = useTheme()

  if (isMinimized) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        py={1}
        borderTop="1px solid"
        borderColor="divider"
      >
        <Tooltip title={isDark ? 'Modo claro' : 'Modo escuro'} placement="right">
          <IconButton size="small" onClick={toggleTheme}>
            {isDark ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    )
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={2}
      py={1}
      borderTop="1px solid"
      borderColor="divider"
    >
      <Box display="flex" alignItems="center" gap={1}>
        {isDark ? <DarkIcon fontSize="small" /> : <LightIcon fontSize="small" />}
        <Typography variant="caption" color="text.secondary">
          {isDark ? 'Modo escuro' : 'Modo claro'}
        </Typography>
      </Box>
      <Switch
        size="small"
        checked={isDark}
        onChange={toggleTheme}
        inputProps={{ 'aria-label': 'alternar tema' }}
      />
    </Box>
  )
}
