/**
 * CAMADA: Componentes UI
 * MÓDULO: Error Boundary
 * RESPONSABILIDADE: Capturar erros de renderização e exibir fallback UI
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: React Error Boundary API
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button, Container, Typography, Box, Paper } from '@mui/material'
import { AlertCircle, RefreshCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log para serviço de monitoramento (apenas em produção)
    if (process.env.NODE_ENV === 'production') {
      // Enviar para Sentry ou similar
      console.error('ErrorBoundary capturou erro:', error, errorInfo)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        this.props.fallback || (
          <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <AlertCircle size={48} color="#d32f2f" />
              </Box>
              <Typography variant="h4" gutterBottom color="error">
                Algo deu errado
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Ocorreu um erro inesperado. Tente recarregar a página ou volte mais tarde.
              </Typography>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'left' }}>
                  <Typography variant="caption" component="pre" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<RefreshCcw size={18} />}
                onClick={this.handleReset}
                sx={{ mt: 3 }}
              >
                Recarregar Página
              </Button>
            </Paper>
          </Container>
        )
      )
    }

    return this.props.children
  }
}

// Hook para usar em componentes funcionais
export function useErrorHandler() {
  return (error: Error) => {
    console.error('Erro capturado:', error)
    // Aqui poderia enviar para serviço de monitoramento
  }
}

export default ErrorBoundary
