import { useContext } from 'react'
import { ConfirmDialogContext, ConfirmDialogContextType } from '@/context/ConfirmDialogContext'

export function useConfirmDialog(): ConfirmDialogContextType {
  const context = useContext(ConfirmDialogContext)
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  }
  return context
}

export function useConfirm() {
  const { showConfirm } = useConfirmDialog()
  
  return async (message: string, title = 'Confirmação'): Promise<boolean> => {
    return showConfirm({
      title,
      message,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      isDangerous: false,
    })
  }
}

export function useAlert() {
  const { showAlert } = useConfirmDialog()
  
  return {
    info: (title: string, message: string) => showAlert(title, message, 'info'),
    success: (title: string, message: string) => showAlert(title, message, 'success'),
    warning: (title: string, message: string) => showAlert(title, message, 'warning'),
    error: (title: string, message: string) => showAlert(title, message, 'error'),
  }
}
