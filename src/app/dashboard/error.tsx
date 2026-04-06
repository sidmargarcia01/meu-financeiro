'use client'

import { useEffect } from 'react'
import { Box, Typography, Button, Alert, Container } from '@mui/material'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error.message, error.stack)
  }, [error])

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Erro no Dashboard
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', mb: 1 }}>
          {error.message}
        </Typography>
        {error.digest && (
          <Typography variant="caption" color="text.secondary">
            Digest: {error.digest}
          </Typography>
        )}
      </Alert>
      <Box mt={2}>
        <Button variant="contained" onClick={reset}>
          Tentar novamente
        </Button>
      </Box>
    </Container>
  )
}
