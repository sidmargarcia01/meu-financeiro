/**
 * CAMADA: Components
 * MÓDULO: UI States
 * RESPONSABILIDADE: Componentes para estados de UI (loading, success, error, empty)
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: React, Tailwind CSS, Lucide Icons
 */

'use client'

import { Loader2, CheckCircle, AlertCircle, Inbox, RefreshCw } from 'lucide-react'

// Loading State Component
interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Loading({ message = 'Carregando...', size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className={`animate-spin text-indigo-600 ${sizeClasses[size]}`} />
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
    </div>
  )
}

// Success State Component
interface SuccessProps {
  message: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function Success({ message, description, action, className = '' }: SuccessProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Error State Component
interface ErrorProps {
  message: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function Error({ message, description, action, className = '' }: ErrorProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Empty State Component
interface EmptyProps {
  message: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function Empty({ message, description, action, icon, className = '' }: EmptyProps) {
  const defaultIcon = <Inbox className="h-12 w-12 text-gray-400" />

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      {description && (
        <p className="text-sm text-gray-600 mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Skeleton Loading Component
interface SkeletonProps {
  lines?: number
  className?: string
}

export function Skeleton({ lines = 3, className = '' }: SkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

// Card Skeleton Component
interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-3">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Table Skeleton Component
interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} className="px-6 py-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Retry Button Component
interface RetryButtonProps {
  onRetry: () => void
  isLoading?: boolean
  className?: string
}

export function RetryButton({ onRetry, isLoading = false, className = '' }: RetryButtonProps) {
  return (
    <button
      onClick={onRetry}
      disabled={isLoading}
      className={`
        inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md
        text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Tentar novamente
    </button>
  )
}

// Combined State Component
interface StateProps {
  isLoading?: boolean
  isSuccess?: boolean
  isError?: boolean
  isEmpty?: boolean
  loadingMessage?: string
  successMessage?: string
  successDescription?: string
  errorMessage?: string
  errorDescription?: string
  emptyMessage?: string
  emptyDescription?: string
  action?: {
    label: string
    onClick: () => void
  }
  onRetry?: () => void
  children?: React.ReactNode
  className?: string
}

export function State({
  isLoading,
  isSuccess,
  isError,
  isEmpty,
  loadingMessage,
  successMessage,
  successDescription,
  errorMessage,
  errorDescription,
  emptyMessage,
  emptyDescription,
  action,
  onRetry,
  children,
  className = ''
}: StateProps) {
  if (isLoading) {
    return <Loading message={loadingMessage} className={className} />
  }

  if (isSuccess && successMessage) {
    return (
      <Success
        message={successMessage}
        description={successDescription}
        action={action}
        className={className}
      />
    )
  }

  if (isError && errorMessage) {
    return (
      <Error
        message={errorMessage}
        description={errorDescription}
        action={onRetry ? {
          label: 'Tentar novamente',
          onClick: onRetry
        } : action}
        className={className}
      />
    )
  }

  if (isEmpty && emptyMessage) {
    return (
      <Empty
        message={emptyMessage}
        description={emptyDescription}
        action={action}
        className={className}
      />
    )
  }

  return <>{children}</>
}

// Higher-order component for async states
export function withAsyncState<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WithAsyncStateComponent(props: P & {
    isLoading?: boolean
    isSuccess?: boolean
    isError?: boolean
    isEmpty?: boolean
    error?: Error
    data?: any
    onRetry?: () => void
  }) {
    const {
      isLoading,
      isSuccess,
      isError,
      isEmpty,
      error,
      data,
      onRetry,
      ...rest
    } = props

    return (
      <State
        isLoading={isLoading}
        isSuccess={isSuccess}
        isError={isError}
        isEmpty={isEmpty}
        errorMessage={error?.message || 'Ocorreu um erro inesperado'}
        emptyMessage="Nenhum dado encontrado"
        onRetry={onRetry}
      >
        <Component {...(rest as P)} />
      </State>
    )
  }
}
