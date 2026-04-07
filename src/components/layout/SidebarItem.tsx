/**
 * 📄 Descrição: Item individual de navegação com ícone de estrela para favoritos
 * 🧱 Contexto: Utilizado pelo SidebarGroup e Sidebar
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Next.js, Material-UI
 * 🔍 Dependências: useFavorites, next/link
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Sidebar
 * RESPONSABILIDADE: Item individual de navegação com ícone de estrela para favoritos
 * NÃO DEVE: Fazer fetch, conter lógica de negócio
 * DEPENDE DE: useFavorites, next/link, Material-UI
 */

'use client'

import Link from 'next/link'
import {
  ListItem, ListItemButton, ListItemIcon,
  ListItemText, Tooltip, IconButton
} from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { useFavorites } from '@/hooks/useFavorites'

interface SidebarItemProps {
  itemKey: string
  label: string
  href: string
  icon: React.ReactNode
  isActive: boolean
  isMinimized: boolean
  isChild?: boolean
  showFavorite?: boolean
}

export function SidebarItem({
  itemKey, label, href, icon, isActive,
  isMinimized, isChild = false, showFavorite = false
}: SidebarItemProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const favorited = isFavorite(itemKey)

  return (
    <ListItem
      disablePadding
      secondaryAction={
        showFavorite && !isMinimized ? (
          <Tooltip
            title={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            placement="right"
          >
            <IconButton
              size="small"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                toggleFavorite({ key: itemKey, label, href })
              }}
              sx={{
                opacity: favorited ? 1 : 0,
                '.MuiListItem-root:hover &': { opacity: 1 },
                transition: 'opacity 0.15s'
              }}
            >
              {favorited
                ? <StarIcon fontSize="small" color="warning" />
                : <StarBorderIcon fontSize="small" />
              }
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      <Tooltip title={isMinimized ? label : ''} placement="right">
        <ListItemButton
          component={Link}
          href={href}
          selected={isActive}
          sx={{
            pl: isChild ? 4 : 2,
            pr: showFavorite && !isMinimized ? 5 : 2,
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
