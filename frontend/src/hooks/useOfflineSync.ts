import { useCallback, useEffect, useState } from 'react'
import { getSyncManager, type QueuedRequest } from '@/utils/offlineSync'

/**
 * Hook para usar o sincronizador offline
 */
export function useOfflineSync() {
  const [queueSize, setQueueSize] = useState(0)
  const [queue, setQueue] = useState<QueuedRequest[]>([])

  const syncManager = getSyncManager()

  // Atualiza o tamanho da fila quando muda
  useEffect(() => {
    setQueueSize(syncManager.getQueueSize())
    setQueue(syncManager.getQueue())

    // Polling para atualizar a UI
    const interval = setInterval(() => {
      setQueueSize(syncManager.getQueueSize())
      setQueue(syncManager.getQueue())
    }, 1000)

    return () => clearInterval(interval)
  }, [syncManager])

  const addRequest = useCallback(
    (
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      url: string,
      body?: unknown
    ) => {
      return syncManager.addRequest(method, url, body)
    },
    [syncManager]
  )

  const removeRequest = useCallback(
    (id: string) => {
      syncManager.removeRequest(id)
      setQueueSize(syncManager.getQueueSize())
      setQueue(syncManager.getQueue())
    },
    [syncManager]
  )

  const syncQueue = useCallback(async () => {
    await syncManager.syncQueue()
    setQueueSize(syncManager.getQueueSize())
    setQueue(syncManager.getQueue())
  }, [syncManager])

  const clearQueue = useCallback(() => {
    syncManager.clearQueue()
    setQueueSize(0)
    setQueue([])
  }, [syncManager])

  return {
    queueSize,
    queue,
    addRequest,
    removeRequest,
    syncQueue,
    clearQueue,
  }
}
