/**
 * Type-Safe Environment Configuration
 * Validação de variáveis de ambiente em tempo de compilação
 */

import { z } from 'zod'

/**
 * Schema de validação para variaveis de ambiente
 */
const envSchema = z.object({
  // App
  MODE: z.enum(['development', 'production', 'staging']),
  VITE_APP_NAME: z.string().default('ERP System'),
  VITE_APP_VERSION: z.string().default('1.0.0'),

  // API
  VITE_API_URL: z.string().url('VITE_API_URL deve ser uma URL válida'),
  VITE_API_TIMEOUT: z.string().transform(Number).default('30000'),

  // Sentry
  VITE_SENTRY_DSN: z.string().url('VITE_SENTRY_DSN deve ser uma URL válida').optional(),

  // Google Analytics
  VITE_GA_ID: z.string().optional(),

  // Logging
  VITE_LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  VITE_LOG_REMOTE_URL: z.string().url().optional(),
  VITE_LOG_STORAGE: z.string().transform(Boolean).default('true'),

  // Feature flags
  VITE_ENABLE_ANALYTICS: z.string().transform(Boolean).default('true'),
  VITE_ENABLE_SENTRY: z.string().transform(Boolean).default('true'),
  VITE_ENABLE_PWA: z.string().transform(Boolean).default('true'),

  // Limites
  VITE_MAX_REQUEST_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  VITE_REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
})

// Type inference - garante type safety
export type Env = z.infer<typeof envSchema>

/**
 * Validar e parsear env vars
 */
function parseEnv(): Env {
  try {
    return envSchema.parse(import.meta.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n')

      const message = `Variáveis de ambiente inválidas:\n${missingVars}`

      if (import.meta.env.MODE === 'production') {
        throw new Error(message)
      } else {
        console.warn(message)
      }
    }

    throw error
  }
}

// Singleton
export const env: Env = parseEnv()

/**
 * Helpers para acessar env vars de forma segura
 */
export const config = {
  // App
  get appName() {
    return env.VITE_APP_NAME
  },
  get appVersion() {
    return env.VITE_APP_VERSION
  },
  get isDevelopment() {
    return env.MODE === 'development'
  },
  get isProduction() {
    return env.MODE === 'production'
  },
  get isStaging() {
    return env.MODE === 'staging'
  },

  // API
  get apiUrl() {
    return env.VITE_API_URL
  },
  get apiTimeout() {
    return env.VITE_API_TIMEOUT
  },

  // Sentry
  get sentryDsn() {
    return env.VITE_SENTRY_DSN
  },
  get sentryEnabled() {
    return env.VITE_ENABLE_SENTRY && !!env.VITE_SENTRY_DSN
  },

  // Analytics
  get googleAnalyticsId() {
    return env.VITE_GA_ID
  },
  get analyticsEnabled() {
    return env.VITE_ENABLE_ANALYTICS && !!env.VITE_GA_ID
  },

  // Logging
  get logLevel() {
    return env.VITE_LOG_LEVEL
  },
  get logRemoteUrl() {
    return env.VITE_LOG_REMOTE_URL
  },
  get logStorage() {
    return env.VITE_LOG_STORAGE
  },

  // PWA
  get pwaEnabled() {
    return env.VITE_ENABLE_PWA
  },

  // Limites
  get maxRequestSize() {
    return env.VITE_MAX_REQUEST_SIZE
  },
  get requestTimeout() {
    return env.VITE_REQUEST_TIMEOUT
  },
}

/**
 * Valida configuração em tempo de inicialização
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // API URL é obrigatório
  if (!env.VITE_API_URL) {
    errors.push('VITE_API_URL é obrigatório')
  }

  // Timeout deve ser positivo
  if (env.VITE_API_TIMEOUT <= 0) {
    errors.push('VITE_API_TIMEOUT deve ser positivo')
  }

  // Max request size deve ser positivo
  if (env.VITE_MAX_REQUEST_SIZE <= 0) {
    errors.push('VITE_MAX_REQUEST_SIZE deve ser positivo')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Log da configuração (sem dados sensíveis)
 */
export function logConfig() {
  console.log('App Configuration:', {
    app: {
      name: config.appName,
      version: config.appVersion,
      environment: env.MODE,
    },
    api: {
      url: config.apiUrl.split('.')[0] + '...',
      timeout: config.apiTimeout,
    },
    features: {
      analytics: config.analyticsEnabled,
      sentry: config.sentryEnabled,
      pwa: config.pwaEnabled,
    },
    logging: {
      level: config.logLevel,
      storage: config.logStorage,
    },
  })
}

// Validar ao importar
const validation = validateConfig()
if (!validation.valid && config.isProduction) {
  throw new Error(`Configuration errors:\n${validation.errors.join('\n')}`)
}
