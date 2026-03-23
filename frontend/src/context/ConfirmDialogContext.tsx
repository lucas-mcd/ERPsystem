import React, { createContext, useState, useCallback, ReactNode } from 'react'
import { ConfirmDialog } from '@/components/ui/Modal'

export interface ConfirmDialogState {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
}

export interface ConfirmDialogContextType {
  showConfirm: (options: Omit<ConfirmDialogState, 'isOpen' | 'isLoading'>) => Promise<boolean>
  showAlert: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => Promise<void>
}

export const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    isDangerous: false,
    isLoading: false,
  })

  const [resolveConfirm, setResolveConfirm] = useState<((value: boolean) => void) | null>(null)

  const handleConfirm = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))
    try {
      if (resolveConfirm) {
        resolveConfirm(true)
      }
    } finally {
      setState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        isDangerous: false,
        isLoading: false,
      })
      setResolveConfirm(null)
    }
  }, [resolveConfirm])

  const handleCancel = useCallback(() => {
    if (resolveConfirm) {
      resolveConfirm(false)
    }
    setState({
      isOpen: false,
      title: '',
      message: '',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      isDangerous: false,
      isLoading: false,
    })
    setResolveConfirm(null)
  }, [resolveConfirm])

  const showConfirm = useCallback(
    (options: Omit<ConfirmDialogState, 'isOpen' | 'isLoading'>) => {
      return new Promise<boolean>((resolve) => {
        setState({
          ...options,
          isOpen: true,
          isLoading: false,
        })
        setResolveConfirm(() => resolve)
      })
    },
    []
  )

  const showAlert = useCallback(
    (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      return new Promise<void>((resolve) => {
        setState({
          title,
          message,
          isOpen: true,
          isLoading: false,
          confirmText: 'OK',
          cancelText: '',
          isDangerous: type === 'error' || type === 'warning',
        })
        setResolveConfirm(() => {
          return (value: boolean) => {
            resolve()
          }
        })
      })
    },
    []
  )

  return (
    <ConfirmDialogContext.Provider value={{ showConfirm, showAlert }}>
      {children}
      <ConfirmDialog
        isOpen={state.isOpen}
        title={state.title}
        message={state.message}
        confirmText={state.confirmText}
        cancelText={state.cancelText}
        isDangerous={state.isDangerous}
        isLoading={state.isLoading}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmDialogContext.Provider>
  )
}
