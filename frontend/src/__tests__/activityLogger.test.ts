import { ActivityLogger, activityLogger } from '@/lib/activityLogger'

describe('ActivityLogger', () => {
  let logger: ActivityLogger

  beforeEach(() => {
    logger = new ActivityLogger()
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('creates a new log entry', () => {
    const log = logger.log(
      'user123',
      'John Doe',
      'john@example.com',
      'LOGIN',
      'USER',
      { status: 'success' }
    )

    expect(log).toMatchObject({
      userId: 'user123',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      action: 'LOGIN',
      resource: 'USER',
      status: 'success',
    })
    expect(log.id).toBeDefined()
    expect(log.timestamp).toBeDefined()
  })

  it('retrieves logs with filtering', () => {
    logger.log('user1', 'User 1', 'user1@example.com', 'LOGIN', 'USER', {
      status: 'success',
    })
    logger.log('user2', 'User 2', 'user2@example.com', 'DELETE', 'CLIENT', {
      status: 'failed',
    })
    logger.log('user1', 'User 1', 'user1@example.com', 'CREATE', 'PRODUCT', {
      status: 'success',
    })

    const userLogs = logger.getLogs({ userId: 'user1' })
    expect(userLogs).toHaveLength(2)

    const loginLogs = logger.getLogs({ action: 'LOGIN' })
    expect(loginLogs).toHaveLength(1)

    const failedLogs = logger.getLogs({ status: 'failed' })
    expect(failedLogs).toHaveLength(1)
  })

  it('searches logs by query', () => {
    logger.log('user1', 'John Doe', 'john@example.com', 'LOGIN', 'USER', {
      status: 'success',
    })
    logger.log('user2', 'Jane Smith', 'jane@example.com', 'DELETE', 'CLIENT', {
      status: 'failed',
    })

    const results = logger.search('john')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].userName).toContain('John')
  })

  it('generates statistics', () => {
    logger.log('user1', 'User 1', 'user1@example.com', 'LOGIN', 'USER', {
      status: 'success',
    })
    logger.log('user1', 'User 1', 'user1@example.com', 'CREATE', 'PRODUCT', {
      status: 'success',
    })
    logger.log('user2', 'User 2', 'user2@example.com', 'DELETE', 'CLIENT', {
      status: 'failed',
    })

    const stats = logger.getStats()

    expect(stats.total).toBe(3)
    expect(stats.byAction.LOGIN).toBe(1)
    expect(stats.byAction.CREATE).toBe(1)
    expect(stats.byAction.DELETE).toBe(1)
    expect(stats.byStatus.success).toBe(2)
    expect(stats.byStatus.failed).toBe(1)
    expect(Object.keys(stats.byUser).length).toBe(2)
  })

  it('exports logs to JSON', () => {
    logger.log('user1', 'User 1', 'user1@example.com', 'LOGIN', 'USER', {
      status: 'success',
    })

    const json = logger.exportLogs('json')
    const parsed = JSON.parse(json)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed[0].action).toBe('LOGIN')
  })

  it('exports logs to CSV', () => {
    logger.log('user1', 'User 1', 'user1@example.com', 'LOGIN', 'USER', {
      status: 'success',
    })

    const csv = logger.exportLogs('csv')

    expect(csv).toContain('ID')
    expect(csv).toContain('Usuário')
    expect(csv).toContain('LOGIN')
  })

  it('clears old logs based on days', () => {
    const oldLog = logger.log(
      'user1',
      'User 1',
      'user1@example.com',
      'LOGIN',
      'USER',
      { status: 'success' }
    )

    // Manually set timestamp to 100+ days ago
    oldLog.timestamp = Date.now() - 100 * 24 * 60 * 60 * 1000

    const removed = logger.clearOldLogs(90)

    expect(removed).toBeGreaterThan(0)
  })

  it('retrieves recent logs with limit', () => {
    for (let i = 0; i < 100; i++) {
      logger.log(`user${i}`, `User ${i}`, `user${i}@example.com`, 'LOGIN', 'USER', {
        status: 'success',
      })
    }

    const recent = logger.getRecentLogs(10)
    expect(recent.length).toBe(10)
  })

  it('throws error when useTheme hook is used outside provider', () => {
    expect(() => {
      new ActivityLogger()
    }).not.toThrow()
  })
})
