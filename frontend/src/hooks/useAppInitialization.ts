import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getLogger } from '@/utils/logger'
import { initWebVitals } from '@/utils/webVitals'
import { initSentry, setSentryUser, clearSentryUser, addSentryBreadcrumb } from '@/utils/sentry'
import { config } from '@/config/env'
import { getApiClient } from '@/utils/apiClient'

const logger = getLogger()

/**
 * Hook de inicialização da aplicação
 * Configura logging, Sentry, Web Vitals, Auth, etc.
 */
export function useAppInitialization() {
  const { user, token, refresh } = useAuth()
  const apiClient = getApiClient()

  // Inicialização única
  useEffect(() => {
    logger.info('Initializing application', {
      environment: config.isProduction ? 'production' : 'development',
      version: config.appVersion,
    })

    // Sentry
    if (config.sentryEnabled) {
      initSentry()
      logger.info('Sentry initialized')
    }

    // Web Vitals
    initWebVitals()
    logger.info('Web Vitals monitoring started')

    // Setup API Auth
    apiClient.setupAuth(
      () => token,
      refresh
    )
    logger.info('API client auth configured')

    // Set user no Sentry quando fizer login
    if (user) {
      setSentryUser(user.id, user.email, user.name)
      addSentryBreadcrumb(`User logged in: ${user.email}`, 'auth')
    } else {
      clearSentryUser()
    }

    // Log de performance
    if ('performance' in window) {
      const perfData = window.performance.timing
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart
      logger.info('Page load metrics', { pageLoadTime })
    }
  }, [user, token])

  // Log de mudança de token
  useEffect(() => {
    if (token) {
      addSentryBreadcrumb('Token updated', 'auth')
    }
  }, [token])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      logger.info('Application unmounted')
    }
  }, [])

  return {
    initialized: true,
    user,
    logger,
    config,
  }
}
