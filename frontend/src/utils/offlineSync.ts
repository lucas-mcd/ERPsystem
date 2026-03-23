/**
 * Hook para sincronizar dados offline
 * Fila requisições enquanto offline e executa quando online
 */

interface QueuedRequest {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  body?: unknown
  timestamp: number
  retries: number
}

const QUEUE_KEY = 'erp_request_queue'
const MAX_RETRIES = 3

class OfflineSyncManager {
  private queue: Map<string, QueuedRequest> = new Map()
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    this.loadQueue()
    this.setupListeners()
  }

  private setupListeners() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  private loadQueue() {
    if (typeof localStorage === 'undefined') return

    try {
      const stored = localStorage.getItem(QUEUE_KEY)
      if (stored) {
        const requests = JSON.parse(stored) as QueuedRequest[]
        requests.forEach((req) => {
          this.queue.set(req.id, req)
        })
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error)
    }
  }

  private saveQueue() {
    if (typeof localStorage === 'undefined') return

    try {
      const requests = Array.from(this.queue.values())
      localStorage.setItem(QUEUE_KEY, JSON.stringify(requests))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  /**
   * Adiciona uma requisição à fila
   */
  addRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    body?: unknown
  ) {
    const id = `${method}-${url}-${Date.now()}`
    const request: QueuedRequest = {
      id,
      method,
      url,
      body,
      timestamp: Date.now(),
      retries: 0,
    }

    this.queue.set(id, request)
    this.saveQueue()

    // Se online, executa imediatamente
    if (this.isOnline) {
      this.executeRequest(request)
    }

    return id
  }

  /**
   * Remove uma requisição da fila
   */
  removeRequest(id: string) {
    this.queue.delete(id)
    this.saveQueue()
  }

  /**
   * Executa uma requisição
   */
  private async executeRequest(request: QueuedRequest) {
    try {
      const init: RequestInit = {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
      }

      if (request.body) {
        init.body = JSON.stringify(request.body)
      }

      const response = await fetch(request.url, init)

      if (response.ok) {
        this.removeRequest(request.id)
        return true
      } else {
        // Retry se status for 5xx
        if (response.status >= 500) {
          this.retryRequest(request)
          return false
        } else {
          // Remove request se erro 4xx (cliente)
          this.removeRequest(request.id)
          return false
        }
      }
    } catch (error) {
      // Network error, retry later
      this.retryRequest(request)
      return false
    }
  }

  /**
   * Tenta novamente uma requisição
   */
  private retryRequest(request: QueuedRequest) {
    if (request.retries < MAX_RETRIES) {
      request.retries++
      this.queue.set(request.id, request)
      this.saveQueue()
    } else {
      // Remove após máximo de tentativas
      this.removeRequest(request.id)
    }
  }

  /**
   * Sincroniza a fila quando volta online
   */
  async syncQueue() {
    const requests = Array.from(this.queue.values())

    for (const request of requests) {
      if (!this.isOnline) break
      await this.executeRequest(request)
      // Delay entre requisições para evitar overload
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  /**
   * Retorna o número de requisições na fila
   */
  getQueueSize() {
    return this.queue.size
  }

  /**
   * Retorna as requisições da fila
   */
  getQueue() {
    return Array.from(this.queue.values())
  }

  /**
   * Limpa toda a fila
   */
  clearQueue() {
    this.queue.clear()
    this.saveQueue()
  }
}

// Singleton instance
let syncManager: OfflineSyncManager | null = null

function getSyncManager() {
  if (!syncManager) {
    syncManager = new OfflineSyncManager()
  }
  return syncManager
}

export { OfflineSyncManager, getSyncManager, type QueuedRequest }
