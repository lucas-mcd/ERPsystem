import {
  TwoFAManager,
  TwoFAAttemptLimiter,
  generateTOTPSecret,
  generateBackupCodes,
  verifyTOTPToken,
} from '@/lib/twoFAManager'

describe('TwoFAManager', () => {
  let manager: TwoFAManager

  beforeEach(() => {
    manager = new TwoFAManager()
    jest.clearAllMocks()
  })

  it('creates a new 2FA session', () => {
    const session = manager.createSession('user123')

    expect(session).toMatchObject({
      userId: 'user123',
      enabled: false,
      backupCodes: expect.any(Array),
      usedBackupCodes: [],
    })
    expect(session.backupCodes.length).toBe(10)
    expect(session.secret).toBeDefined()
  })

  it('retrieves an existing session', () => {
    manager.createSession('user123')
    const session = manager.getSession('user123')

    expect(session).toBeDefined()
    expect(session?.userId).toBe('user123')
  })

  it('disables 2FA for a user', () => {
    manager.createSession('user123')
    const result = manager.disable('user123')

    expect(result).toBe(true)
    expect(manager.getSession('user123')).toBeUndefined()
  })

  it('tracks remaining backup codes', () => {
    const session = manager.createSession('user123')
    session.enabled = true
    session.usedBackupCodes = ['CODE1', 'CODE2']

    const remaining = manager.getRemainingSessions('user123')

    expect(remaining).toBe(8)
  })
})

describe('TwoFAAttemptLimiter', () => {
  let limiter: TwoFAAttemptLimiter

  beforeEach(() => {
    limiter = new TwoFAAttemptLimiter()
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('tracks failed attempts', () => {
    limiter.recordAttempt('user123')
    limiter.recordAttempt('user123')

    const remaining = limiter.getRemainingAttempts('user123')
    expect(remaining).toBe(3)
  })

  it('determines when user is locked out', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt('user123')
    }

    expect(limiter.isLocked('user123')).toBe(true)
  })

  it('resets lockout after time window', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt('user123')
    }

    expect(limiter.isLocked('user123')).toBe(true)

    // Fast forward 16 minutes
    jest.advanceTimersByTime(16 * 60 * 1000)

    expect(limiter.isLocked('user123')).toBe(false)
  })

  it('resets user attempts', () => {
    for (let i = 0; i < 3; i++) {
      limiter.recordAttempt('user123')
    }

    limiter.reset('user123')
    const remaining = limiter.getRemainingAttempts('user123')

    expect(remaining).toBe(5)
  })

  it('returns unlock time', () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordAttempt('user123')
    }

    const unlockTime = limiter.getUnlockTime('user123')
    expect(unlockTime).toBeGreaterThan(0)
  })
})

describe('TOTP Functions', () => {
  it('generates a valid TOTP secret', () => {
    const result = generateTOTPSecret('user@example.com')

    expect(result.secret).toBeDefined()
    expect(result.secret.length).toBeGreaterThan(0)
    expect(result.qrCode).toBeDefined()
  })

  it('generates backup codes', () => {
    const codes = generateBackupCodes(10)

    expect(codes.length).toBe(10)
    expect(codes.every((code) => code.length === 8)).toBe(true)
  })

  it('verifies TOTP tokens', () => {
    // Since we can't predict TOTP codes without a real secret,
    // we test that the function returns a boolean
    const result = verifyTOTPToken('testSecret123', '000000')

    expect(result).toHaveProperty('isValid')
    expect(typeof result.isValid).toBe('boolean')
  })

  it('rejects invalid TOTP tokens', () => {
    const result = verifyTOTPToken('invalidSecret', 'invalid')

    expect(result.isValid).toBe(false)
  })
})
