import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

/**
 * Componente que mostra o status de conexão do usuário
 */
export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline) {
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded">
        <Wifi className="w-3 h-3" />
        <span>Online</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  )
}

/**
 * Hook para usar status de conexão
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

/**
 * Componente que mostra um banner quando offline
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-amber-100 dark:bg-amber-900 border-b-2 border-amber-300 dark:border-amber-700 px-4 py-3">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <WifiOff className="w-5 h-5 text-amber-700 dark:text-amber-300 flex-shrink-0" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
          Você está offline. Algumas funcionalidades podem estar limitadas. Os dados
          serão sincronizados quando a conexão for restaurada.
        </p>
      </div>
    </div>
  )
}
