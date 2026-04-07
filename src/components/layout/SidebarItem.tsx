/**
 * CAMADA: Component
 * MODULO: Layout - Sidebar
 * RESPONSABILIDADE: Renderizar um item individual de navegacao na sidebar
 * NAO DEVE: Conter logica de negocio, fazer fetch, calcular estados de rota
 * DEPENDE DE: useNavigation hook, next/link, Material-UI
 */

'use client'

import Link from 'next/link'
import { ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from '@mui/material'

interface SidebarItemProps {
  label: string
  href: string
  icon: React.ReactNode
  isActive: boolean
  isMinimized: boolean
  isChild?: boolean
}

export function SidebarItem({
  label,
  href,
  icon,
  isActive,
  isMinimized,
  isChild = false,
}: SidebarItemProps) {
  return (
    <ListItem disablePadding>
      <Tooltip title={isMinimized ? label : ''} placement="right">
        <ListItemButton
          component={Link}
          href={href}
          selected={isActive}
          sx={{
            pl: isChild ? 4 : 2,
            borderRadius: 1,
            mx: 1,
            mb: 0.5,
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'white',
              '& .MuiListItemIcon-root': { color: 'white' },
              '&:hover': { backgroundColor: 'primary.dark' },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>{icon}</ListItemIcon>
          {!isMinimized && (
            <ListItemText
              primary={label}
              primaryTypographyProps={{ fontSize: 14 }}
            />
          )}
        </ListItemButton>
      </Tooltip>
    </ListItem>
  )
}
