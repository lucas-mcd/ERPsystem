import React, { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'

/**
 * Componente que notifica o usuário sobre atualizações do Service Worker
 */
export function PWAUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    // Listen for SW update event
    window.addEventListener('swupdate', () => {
      setShowUpdate(true)
    })
  }, [])

  const handleUpdate = () => {
    // Reload page to apply update
    window.location.reload()
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Atualização Disponível
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Uma nova versão da aplicação está disponível. Clique em atualizar
              para obter as últimas melhorias.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Atualizar Agora
              </button>
              <button
                onClick={() => setShowUpdate(false)}
                className="px-3 py-2 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm font-medium rounded transition-colors"
              >
                Depois
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowUpdate(false)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook para verificar se o app é instalado como PWA
 */
export function useIsInstalledPWA() {
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if the app is running as a standalone app (PWA)
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches

    setIsInstalled(isStandalone)
  }, [])

  return isInstalled
}

/**
 * Hook para gerenciar o prompt de instalação de PWA
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    const successful = outcome === 'accepted'

    setDeferredPrompt(null)
    setCanInstall(false)

    return successful
  }

  return {
    canInstall,
    promptInstall,
  }
}
