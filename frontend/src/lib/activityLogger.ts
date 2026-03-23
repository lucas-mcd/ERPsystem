export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'VIEW'
  | 'DOWNLOAD'
  | 'SETTINGS_CHANGE'
  | '2FA_ENABLE'
  | '2FA_DISABLE'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'FAILED_LOGIN'
  | 'UNAUTHORIZED_ACCESS'
  | 'ERROR'

export type AuditResourceType =
  | 'USER'
  | 'CLIENT'
  | 'PRODUCT'
  | 'ORDER'
  | 'REPORT'
  | 'SETTINGS'
  | 'PERMISSION'
  | 'AUDIT_LOG'

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: AuditActionType
  resource: AuditResourceType
  resourceId?: string
  resourceName?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failed'
  errorMessage?: string
  timestamp: number
  date: string
  time: string
}

export class ActivityLogger {
  private logs: AuditLog[] = []
  private maxLogs = 10000
  private persistent = true

  constructor() {
    this.loadLogs()
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private getCurrentTimestamp() {
    const now = new Date()
    return {
      timestamp: Date.now(),
      date: now.toLocaleDateString('pt-BR'),
      time: now.toLocaleTimeString('pt-BR'),
    }
  }

  log(
    userId: string,
    userName: string,
    userEmail: string,
    action: AuditActionType,
    resource: AuditResourceType,
    options: {
      resourceId?: string
      resourceName?: string
      details?: Record<string, any>
      status?: 'success' | 'failed'
      errorMessage?: string
    } = {}
  ): AuditLog {
    const { timestamp, date, time } = this.getCurrentTimestamp()

    const auditLog: AuditLog = {
      id: this.generateId(),
      userId,
      userName,
      userEmail,
      action,
      resource,
      resourceId: options.resourceId,
      resourceName: options.resourceName,
      details: options.details,
      ipAddress: this.getClientIpAddress(),
      userAgent: navigator.userAgent,
      status: options.status || 'success',
      errorMessage: options.errorMessage,
      timestamp,
      date,
      time,
    }

    this.logs.unshift(auditLog)

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    if (this.persistent) {
      this.saveLogs()
    }

    return auditLog
  }

  private getClientIpAddress(): string {
    // In a real application, this would come from the server
    return 'client'
  }

  getLogs(options: {
    userId?: string
    action?: AuditActionType
    resource?: AuditResourceType
    status?: 'success' | 'failed'
    dateFrom?: string
    dateTo?: string
    limit?: number
  } = {}): AuditLog[] {
    let filtered = [...this.logs]

    if (options.userId) {
      filtered = filtered.filter((log) => log.userId === options.userId)
    }

    if (options.action) {
      filtered = filtered.filter((log) => log.action === options.action)
    }

    if (options.resource) {
      filtered = filtered.filter((log) => log.resource === options.resource)
    }

    if (options.status) {
      filtered = filtered.filter((log) => log.status === options.status)
    }

    if (options.dateFrom) {
      filtered = filtered.filter((log) => log.date >= options.dateFrom!)
    }

    if (options.dateTo) {
      filtered = filtered.filter((log) => log.date <= options.dateTo!)
    }

    if (options.limit) {
      filtered = filtered.slice(0, options.limit)
    }

    return filtered
  }

  getLogById(id: string): AuditLog | undefined {
    return this.logs.find((log) => log.id === id)
  }

  getStats(options: {
    dateFrom?: string
    dateTo?: string
  } = {}): {
    total: number
    byAction: Record<AuditActionType, number>
    byResource: Record<AuditResourceType, number>
    byStatus: Record<string, number>
    byUser: Record<string, number>
  } {
    let filtered = [...this.logs]

    if (options.dateFrom) {
      filtered = filtered.filter((log) => log.date >= options.dateFrom!)
    }

    if (options.dateTo) {
      filtered = filtered.filter((log) => log.date <= options.dateTo!)
    }

    const stats = {
      total: filtered.length,
      byAction: {} as Record<AuditActionType, number>,
      byResource: {} as Record<AuditResourceType, number>,
      byStatus: {} as Record<string, number>,
      byUser: {} as Record<string, number>,
    }

    filtered.forEach((log) => {
      // By action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1

      // By resource
      stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1

      // By status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1

      // By user
      stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1
    })

    return stats
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2)
    }

    // CSV format
    const headers = [
      'ID',
      'Usuário',
      'Email',
      'Ação',
      'Recurso',
      'ID Recurso',
      'Status',
      'Data',
      'Hora',
      'Detalhes',
    ]
    const rows = this.logs.map((log) => [
      log.id,
      log.userName,
      log.userEmail,
      log.action,
      log.resource,
      log.resourceId || '',
      log.status,
      log.date,
      log.time,
      JSON.stringify(log.details || {}),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === 'string' && cell.includes(',')
              ? `"${cell}"`
              : cell
          )
          .join(',')
      ),
    ].join('\n')

    return csv
  }

  downloadLogs(format: 'json' | 'csv' = 'json'): void {
    const content = this.exportLogs(format)
    const blob = new Blob([content], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-logs-${Date.now()}.${format === 'json' ? 'json' : 'csv'}`
    link.click()
    URL.revokeObjectURL(url)
  }

  clearOldLogs(daysOld: number = 90): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)
    const cutoffTime = cutoffDate.getTime()

    const initialLength = this.logs.length
    this.logs = this.logs.filter((log) => log.timestamp > cutoffTime)

    const removed = initialLength - this.logs.length
    if (removed > 0 && this.persistent) {
      this.saveLogs()
    }

    return removed
  }

  private saveLogs(): void {
    try {
      const serialized = JSON.stringify(this.logs)
      localStorage.setItem('audit_logs', serialized)
    } catch (error) {
      console.error('Failed to save audit logs:', error)
    }
  }

  private loadLogs(): void {
    try {
      const stored = localStorage.getItem('audit_logs')
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      this.logs = []
    }
  }

  clear(): void {
    this.logs = []
    if (this.persistent) {
      localStorage.removeItem('audit_logs')
    }
  }

  getRecentLogs(limit: number = 50): AuditLog[] {
    return this.logs.slice(0, limit)
  }

  search(query: string): AuditLog[] {
    const lowerQuery = query.toLowerCase()
    return this.logs.filter(
      (log) =>
        log.userName.toLowerCase().includes(lowerQuery) ||
        log.userEmail.toLowerCase().includes(lowerQuery) ||
        log.action.toLowerCase().includes(lowerQuery) ||
        log.resource.toLowerCase().includes(lowerQuery) ||
        log.resourceName?.toLowerCase().includes(lowerQuery) ||
        log.errorMessage?.toLowerCase().includes(lowerQuery)
    )
  }
}

// Export default instance
export const activityLogger = new ActivityLogger()
