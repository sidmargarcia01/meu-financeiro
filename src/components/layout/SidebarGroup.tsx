/**
 * CAMADA: Component
 * MODULO: Layout - Sidebar
 * RESPONSABILIDADE: Renderizar grupo colapsavel de itens na sidebar
 * NAO DEVE: Conter logica de negocio, acessar APIs
 * DEPENDE DE: SidebarItem, Material-UI
 */

'use client'

import { List, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material'
import { ExpandLess, ExpandMore } from '@mui/icons-material'

interface SidebarGroupProps {
  label: string
  icon: React.ReactNode
  isCollapsed: boolean
  isMinimized: boolean
  onToggle: () => void
  children: React.ReactNode
}

export function SidebarGroup({
  label,
  icon,
  isCollapsed,
  isMinimized,
  onToggle,
  children,
}: SidebarGroupProps) {
  if (isMinimized) {
    return <List disablePadding>{children}</List>
  }

  return (
    <>
      <ListItemButton
        onClick={onToggle}
        sx={{ pl: 2, borderRadius: 1, mx: 1, mb: 0.5 }}
      >
        <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: 13,
            fontWeight: 600,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        />
        {isCollapsed ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
      </ListItemButton>
      <Collapse in={!isCollapsed} timeout="auto" unmountOnExit>
        <List disablePadding>{children}</List>
      </Collapse>
    </>
  )
}
