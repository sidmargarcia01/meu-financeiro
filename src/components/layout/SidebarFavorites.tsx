/**
 * 📄 Descrição: Seção de favoritos no topo da sidebar — "pinar itens para acesso rápido"
 * 🧱 Contexto: Renderizado no topo do Sidebar, acima dos grupos de navegação
 * 📌 Responsável: Windsurf AI
 * 📅 Data: 2026-04-07
 * ⚙️ Tecnologias: React, Material-UI
 * 🔍 Dependências: useFavorites, useNavigation, SidebarItem
 * ✅ Revisado: Sim
 *
 * CAMADA: Component
 * MÓDULO: Layout - Sidebar
 * RESPONSABILIDADE: Seção de itens favoritos no topo da sidebar
 * NÃO DEVE: Fazer fetch, conter lógica de negócio
 * DEPENDE DE: useFavorites, useNavigation, SidebarItem
 */

'use client'

import { Box, Typography, List, Divider } from '@mui/material'
import { Star as StarIcon } from '@mui/icons-material'
import { useFavorites } from '@/hooks/useFavorites'
import { useNavigation } from '@/hooks/useNavigation'
import { SidebarItem } from './SidebarItem'

interface SidebarFavoritesProps {
  isMinimized: boolean
}

export function SidebarFavorites({ isMinimized }: SidebarFavoritesProps) {
  const { favorites } = useFavorites()
  const { isRouteActive } = useNavigation()

  if (favorites.length === 0) return null

  return (
    <>
      {!isMinimized && (
        <Box px={2} pt={1} pb={0.5} display="flex" alignItems="center" gap={0.5}>
          <StarIcon sx={{ fontSize: 12, color: 'warning.main' }} />
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={600}
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Favoritos
          </Typography>
        </Box>
      )}
      <List disablePadding>
        {favorites.map(item => (
          <SidebarItem
            key={item.key}
            itemKey={item.key}
            label={item.label}
            href={item.href}
            icon={<StarIcon fontSize="small" color="warning" />}
            isActive={isRouteActive(item.href)}
            isMinimized={isMinimized}
          />
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
    </>
  )
}
