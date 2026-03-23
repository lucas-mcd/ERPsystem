/**
 * Sentry Configuration
 * Error tracking e monitoring em produção
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { getLogger } from './logger'

const logger = getLogger()

/**
 * Inicializa Sentry
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN

  if (!dsn) {
    logger.warn('Sentry DSN não configurado. Error tracking desativado.')
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    release: import.meta.env.VITE_APP_VERSION || '1.0.0',

    // Integrations
    integrations: [
      new BrowserTracing(),
    ],

    // Capturar console.error como warning
    attachStacktrace: true,

    // Ignorar certos erros
    ignoreErrors: [
      // Erros de browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      // Erros de cross-origin
      'Non-Error promise rejection captured',
    ],

    // Allowlist de domínios
    allowUrls: [/\nhttps?:\/\/(cdn\.)?example\.com/],

    // Denylist de URLs
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
    ],

    // Before send hook
    beforeSend(event, hint) {
      // Não enviar erros de rede offline
      if (
        hint.originalException instanceof TypeError &&
        hint.originalException.message.includes('Failed to fetch')
      ) {
        return null
      }

      // Log localmente
      logger.error(`Sentry event: ${event.message}`, {
        level: event.level,
        fingerprint: event.fingerprint,
      })

      return event
    },

    // Breadcrumbs
    maxBreadcrumbs: 50,
  })

  logger.info('Sentry initialized', { dsn: dsn.substring(0, 20) + '...' })
}

/**
 * Captura exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, any>) {
  logger.error('Capturing exception', { message: error.message, context }, error)

  Sentry.captureException(error, {
    contexts: {
      app: context,
    },
  })
}

/**
 * Captura mensagem
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (level === 'fatal') {
    logger.fatal(message)
  } else if (level === 'error') {
    logger.error(message)
  } else if (level === 'warning') {
    logger.warn(message)
  } else {
    logger.info(message)
  }

  Sentry.captureMessage(message, level)
}

/**
 * Define usuário no Sentry
 */
export function setSentryUser(userId: string, email?: string, username?: string) {
  Sentry.setUser({
    id: userId,
    email,
    username,
  })
}

/**
 * Remove usuário do Sentry
 */
export function clearSentryUser() {
  Sentry.setUser(null)
}

/**
 * Adiciona contexto ao Sentry
 */
export function addSentryContext(context: Record<string, any>) {
  Sentry.setContext('custom', context)
}

/**
 * Adiciona breadcrumb manualmente
 */
export function addSentryBreadcrumb(
  message: string,
  category: string = 'user-action',
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
  })
}

/**
 * Set tags para agrupar erros no Sentry
 */
export function setSentryTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

/**
 * Start transaction para rastreamento de performance
 * Nota: Sentry.startTransaction não está disponível nessa versão
 * Use BrowserTracing integration para automatic performance tracking
 */
export function startTransaction(name: string, _op: string = 'http.client') {
  // Performance tracking é automático com BrowserTracing integration
  logger.debug(`Transaction start: ${name}`)
  return {
    finish: () => {
      logger.debug(`Transaction end: ${name}`)
    },
  }
}

export { Sentry }
