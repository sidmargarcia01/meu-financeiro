/**
 * CAMADA: Componentes UI
 * MÓDULO: Loading
 * RESPONSABILIDADE: Exibir estado de carregamento consistente
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: Material-UI
 */

'use client'

import React from 'react'
import { Box, CircularProgress, Typography, Container } from '@mui/material'

interface LoadingProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
}

const sizeMap = {
  small: 24,
  medium: 40,
  large: 60,
}

export function Loading({ 
  message = 'Carregando...', 
  size = 'medium',
  fullScreen = false 
}: LoadingProps) {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        ...(fullScreen && {
          minHeight: '100vh',
        }),
      }}
    >
      <CircularProgress size={sizeMap[size]} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  )

  if (fullScreen) {
    return (
      <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {content}
      </Container>
    )
  }

  return content
}

// Componente de skeleton para cards
export function CardSkeleton({ height = 200 }: { height?: number }) {
  return (
    <Box
      sx={{
        height,
        bgcolor: 'grey.100',
        borderRadius: 2,
        animation: 'pulse 1.5s ease-in-out 0.5s infinite',
        '@keyframes pulse': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
      }}
    />
  )
}

// Skeleton para lista de itens
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{
            height: 60,
            bgcolor: 'grey.100',
            borderRadius: 1,
            animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
          }}
        />
      ))}
    </Box>
  )
}

export default Loading
