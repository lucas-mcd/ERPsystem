/**
 * Advanced Logging System
 * Suporta múltiplos níveis, destinations e formatação
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

export interface LogEntry {
  level: LogLevel
  timestamp: string
  message: string
  context?: Record<string, any>
  stack?: string
  userId?: string
  sessionId?: string
  url?: string
}

export interface LoggerConfig {
  minLevel?: LogLevel
  enableConsole?: boolean
  enableStorage?: boolean
  enableRemote?: boolean
  remoteUrl?: string
  maxStoredLogs?: number
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4,
}

const LOG_COLORS = {
  DEBUG: '\x1b[36m',  // cyan
  INFO: '\x1b[32m',   // green
  WARN: '\x1b[33m',   // yellow
  ERROR: '\x1b[31m',  // red
  FATAL: '\x1b[35m',  // magenta
  RESET: '\x1b[0m',
}

/**
 * Logger principal
 */
class Logger {
  private config: Required<LoggerConfig>
  private logs: LogEntry[] = []
  private sessionId: string = this.generateSessionId()

  constructor(config: LoggerConfig = {}) {
    this.config = {
      minLevel: config.minLevel || 'DEBUG',
      enableConsole: config.enableConsole !== false,
      enableStorage: config.enableStorage !== false,
      enableRemote: config.enableRemote || false,
      remoteUrl: config.remoteUrl || '',
      maxStoredLogs: config.maxStoredLogs || 1000,
    }

    this.loadStoredLogs()
  }

  /**
   * Gera ID de sessão único
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Verifica se log deve ser processado baseado no level
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel]
  }

  /**
   * Formata log para exibição
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString()
    const color = LOG_COLORS[entry.level] as string
    const reset = LOG_COLORS.RESET

    let message = `${color}[${entry.level}]${reset} ${timestamp} - ${entry.message}`

    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n${JSON.stringify(entry.context, null, 2)}`
    }

    if (entry.stack) {
      message += `\n${entry.stack}`
    }

    return message
  }

  /**
   * Log de debug
   */
  debug(message: string, context?: Record<string, any>) {
    this.log('DEBUG', message, context)
  }

  /**
   * Log de informação
   */
  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context)
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context)
  }

  /**
   * Log de erro
   */
  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log('ERROR', message, context, error?.stack)
  }

  /**
   * Log fatal
   */
  fatal(message: string, context?: Record<string, any>, error?: Error) {
    this.log('FATAL', message, context, error?.stack)
  }

  /**
   * Log genérico
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string) {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
      stack,
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    // Adicionar user ID se disponível
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.id) {
        entry.userId = user.id
      }
    } catch {
      // Ignore
    }

    // Console
    if (this.config.enableConsole) {
      const levelLower = level.toLowerCase()
      switch (levelLower) {
        case 'debug':
          // eslint-disable-next-line no-console
          console.debug(this.formatMessage(entry))
          break
        case 'info':
          // eslint-disable-next-line no-console
          console.info(this.formatMessage(entry))
          break
        case 'warn':
          // eslint-disable-next-line no-console
          console.warn(this.formatMessage(entry))
          break
        case 'error':
        case 'fatal':
          // eslint-disable-next-line no-console
          console.error(this.formatMessage(entry))
          break
      }
    }

    // Storage local
    if (this.config.enableStorage) {
      this.addToStorage(entry)
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteUrl) {
      this.sendRemote(entry)
    }
  }

  /**
   * Adiciona log ao localStorage
   */
  private addToStorage(entry: LogEntry) {
    try {
      this.logs.push(entry)

      // Manter limite máximo
      if (this.logs.length > this.config.maxStoredLogs) {
        this.logs = this.logs.slice(-this.config.maxStoredLogs)
      }

      localStorage.setItem('erp_logs', JSON.stringify(this.logs))
    } catch (error) {
      console.error('Failed to store log:', error)
    }
  }

  /**
   * Carrega logs armazenados
   */
  private loadStoredLogs() {
    try {
      const stored = localStorage.getItem('erp_logs')
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load stored logs:', error)
    }
  }

  /**
   * Envia log para servidor remoto
   */
  private async sendRemote(entry: LogEntry) {
    try {
      await fetch(this.config.remoteUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
    } catch (error) {
      console.error('Failed to send remote log:', error)
    }
  }

  /**
   * Obtém logs armazenados
   */
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filtered = this.logs

    if (level) {
      filtered = filtered.filter((log) => log.level === level)
    }

    if (limit) {
      filtered = filtered.slice(-limit)
    }

    return filtered
  }

  /**
   * Limpa logs armazenados
   */
  clearLogs() {
    this.logs = []
    try {
      localStorage.removeItem('erp_logs')
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  /**
   * Exporta logs em JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * Exporta logs em CSV
   */
  exportLogsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Message', 'User', 'URL']
    const rows = this.logs.map((log) => [
      log.timestamp,
      log.level,
      log.message,
      log.userId || 'N/A',
      log.url || 'N/A',
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')

    return csv
  }
}

// Singleton instance
let logger: Logger | null = null

/**
 * Obtém instância do logger
 */
export function getLogger(config?: LoggerConfig): Logger {
  if (!logger) {
    logger = new Logger(config)
  }
  return logger
}

export { Logger }
