/**
 * CAMADA: Components
 * MÓDULO: Confirm Dialog
 * RESPONSABILIDADE: Diálogo de confirmação para ações destrutivas
 * NÃO DEVE: Conter lógica de negócio
 * DEPENDE DE: React, Tailwind CSS, Lucide Icons
 */

'use client'

import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
    } finally {
      setIsConfirming(false)
    }
  }

  if (!isOpen) return null

  const variantStyles = {
    danger: {
      icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
      iconBg: 'bg-red-100',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white'
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
      iconBg: 'bg-yellow-100',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    info: {
      icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
      iconBg: 'bg-blue-100',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const currentStyle = variantStyles[variant]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onCancel}
        />

        {/* Dialog panel */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex items-start">
            {/* Icon */}
            <div className={`flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-full ${currentStyle.iconBg}`}>
              {currentStyle.icon}
            </div>

            {/* Content */}
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
                {description && (
                  <p className="text-sm text-gray-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onCancel}
              className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-500"
              disabled={isConfirming || isLoading}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              onClick={onCancel}
              disabled={isConfirming || isLoading}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 ${currentStyle.confirmButton}`}
              onClick={handleConfirm}
              disabled={isConfirming || isLoading}
            >
              {isConfirming || isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processando...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook para usar o diálogo de confirmação
export function useConfirmDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm?: () => void | Promise<void>
  }>({
    isOpen: false,
    title: '',
    message: ''
  })

  const confirm = (options: {
    title: string
    message: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'info'
    onConfirm: () => void | Promise<void>
  }) => {
    setDialog({
      ...options,
      isOpen: true
    })
  }

  const handleCancel = () => {
    setDialog(prev => ({ ...prev, isOpen: false }))
  }

  const handleConfirm = async () => {
    if (dialog.onConfirm) {
      await dialog.onConfirm()
    }
    handleCancel()
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      isOpen={dialog.isOpen}
      title={dialog.title}
      message={dialog.message}
      description={dialog.description}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      variant={dialog.variant}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  )

  return {
    confirm,
    ConfirmDialog: ConfirmDialogComponent
  }
}

// Component de botão com confirmação integrada
interface ConfirmButtonProps {
  children: React.ReactNode
  onConfirm: () => void | Promise<void>
  title?: string
  message?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  disabled?: boolean
  className?: string
}

export function ConfirmButton({
  children,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  description,
  confirmText,
  cancelText,
  variant = 'danger',
  disabled = false,
  className = ''
}: ConfirmButtonProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog()

  const handleClick = () => {
    confirm({
      title,
      message,
      description,
      confirmText,
      cancelText,
      variant,
      onConfirm
    })
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        {children}
      </button>
      <ConfirmDialog />
    </>
  )
}
