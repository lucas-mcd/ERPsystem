/**
 * TanStack Query Configuration
 * Gerenciamento de cache e estado do servidor
 */

import { QueryClient } from '@tanstack/react-query'
import { getLogger } from './logger'

const logger = getLogger()

/**
 * Criar QueryClient com configuração otimizada
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tempo antes de marcar como stale (5 minutos)
        staleTime: 5 * 60 * 1000,

        // Tempo antes de garbage collection (10 minutos)
        gcTime: 10 * 60 * 1000,

        // Retry automático (3x) com backoff exponencial
        retry: (failureCount, error) => {
          // Não retry em erro 4xx
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          // Retry até 3x em erro 5xx ou network
          return failureCount < 3
        },

        retryDelay: (attemptIndex) => {
          return Math.min(1000 * 2 ** attemptIndex, 30000)
        },

        // Background refetch quando janela ganha foco
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,

        // Network mode
        networkMode: 'online',
      },

      mutations: {
        // Retry menos agressivo para mutations
        retry: 1,
        retryDelay: 1000,
        networkMode: 'online',
      },
    },
  })
}

// Singleton
let queryClient: QueryClient | null = null

/**
 * Obtém instância do QueryClient
 */
export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

/**
 * Funções auxiliares para invalidação
 */
export const queryKeys = {
  // Users
  userList: () => ['users'] as const,
  userDetail: (id: string) => ['users', id] as const,
  userSearch: (query: string) => ['users', 'search', query] as const,

  // Clients
  clientList: () => ['clients'] as const,
  clientDetail: (id: string) => ['clients', id] as const,

  // Products
  productList: () => ['products'] as const,
  productDetail: (id: string) => ['products', id] as const,
  productSearch: (query: string) => ['products', 'search', query] as const,

  // Orders
  orderList: () => ['orders'] as const,
  orderDetail: (id: string) => ['orders', id] as const,
  orderStats: () => ['orders', 'stats'] as const,

  // Reports
  reportList: () => ['reports'] as const,
  reportData: (id: string) => ['reports', id] as const,

  // Audit
  auditLogs: () => ['audit'] as const,

  // Dashboard
  dashboardStats: () => ['dashboard', 'stats'] as const,
  dashboardCharts: () => ['dashboard', 'charts'] as const,
}

/**
 * Middleware para logging de queries
 */
export function setupQueryLogging(client: QueryClient) {
  return client.getQueryCache().subscribe((event) => {
    if (event.type === 'added' && event.query.getObserversCount() > 0) {
      logger.debug(`Query started: ${event.query.queryHash}`)
    }
    if (event.type === 'removed') {
      logger.debug(`Query removed: ${event.query.queryHash}`)
    }
  })
}

/**
 * Middleware para logging de mutations
 */
export function setupMutationLogging(client: QueryClient) {
  return client.getMutationCache().subscribe((event) => {
    if (event.type === 'added') {
      logger.debug(`Mutation started`)
    }
    if (event.type === 'updated') {
      if (event.mutation.state.status === 'success') {
        logger.info(`Mutation succeeded`)
      }
      if (event.mutation.state.status === 'error') {
        const error = event.mutation.state.error as Error
        logger.error(`Mutation failed: ${error.message}`)
      }
    }
  })
}
