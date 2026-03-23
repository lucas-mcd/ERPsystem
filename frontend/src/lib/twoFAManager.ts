/**
 * 2FA Manager - Browser Compatible
 * Note: TOTP verification happens on the backend for security
 */

interface TOTP2FASetup {
  secret: string
  qrCodeUrl: string
}

interface VerificationResult {
  isValid: boolean
  remainingTime?: number
}

/**
 * Generate a random secret for TOTP
 * In production, this should be generated on the backend
 */
export function generateTOTPSecret(userEmail: string): TOTP2FASetup {
  // Generate a random base32 string (32 characters)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let secret = ''
  for (let i = 0; i < 32; i++) {
    secret += chars[Math.floor(Math.random() * chars.length)]
  }

  // Format as otpauth URL (QR code compatible)
  const qrCodeUrl = encodeURI(
    `otpauth://totp/ERP System (${userEmail})?secret=${secret}&issuer=ERP System`
  )

  return {
    secret,
    qrCodeUrl,
  }
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = Math.random()
      .toString(36)
      .substring(2, 10)
      .toUpperCase()
    codes.push(code)
  }
  return codes
}

/**
 * Verify TOTP token - MOCK function for browser
 * Real verification should happen on the backend for security
 * This is just for UI/UX purposes
 */
export function verifyTOTPToken(
  secret: string,
  token: string,
  window: number = 2
): VerificationResult {
  try {
    // In a real scenario, this would call the backend API
    // For now, we accept any 6-digit code as "valid" for UI purposes
    // The backend will do the real validation
    const isValidFormat = /^\d{6}$/.test(token)

    return {
      isValid: isValidFormat,
    }
  } catch (error) {
    return {
      isValid: false,
    }
  }
}

export function verifyBackupCode(
  usedCodes: string[],
  availableCodes: string[],
  code: string
): boolean {
  return (
    availableCodes.includes(code.toUpperCase()) &&
    !usedCodes.includes(code.toUpperCase())
  )
}

export function getRemainingCodes(
  usedCodes: string[],
  totalCodes: number
): number {
  return totalCodes - usedCodes.length
}

// Rate limiting for 2FA attempts
export class TwoFAAttemptLimiter {
  private attempts: Map<string, number[]> = new Map()
  private readonly maxAttempts = 5
  private readonly timeWindow = 15 * 60 * 1000 // 15 minutes

  isLocked(userId: string): boolean {
    const now = Date.now()
    const userAttempts = this.attempts.get(userId) || []

    // Remove old attempts outside the time window
    const recentAttempts = userAttempts.filter(
      (time) => now - time < this.timeWindow
    )

    if (recentAttempts.length >= this.maxAttempts) {
      return true
    }

    this.attempts.set(userId, recentAttempts)
    return false
  }

  recordAttempt(userId: string): void {
    const attempts = this.attempts.get(userId) || []
    attempts.push(Date.now())
    this.attempts.set(userId, attempts)
  }

  reset(userId: string): void {
    this.attempts.delete(userId)
  }

  getRemainingAttempts(userId: string): number {
    const now = Date.now()
    const userAttempts = this.attempts.get(userId) || []
    const recentAttempts = userAttempts.filter(
      (time) => now - time < this.timeWindow
    )
    return Math.max(0, this.maxAttempts - recentAttempts.length)
  }

  getUnlockTime(userId: string): number {
    const userAttempts = this.attempts.get(userId) || []
    if (userAttempts.length === 0) return 0

    const oldestAttempt = Math.min(...userAttempts)
    const unlockTime = oldestAttempt + this.timeWindow
    return Math.max(0, unlockTime - Date.now())
  }
}

// Session-based 2FA state management
export interface TwoFASession {
  userId: string
  secret: string
  backupCodes: string[]
  usedBackupCodes: string[]
  enabled: boolean
  createdAt: number
  lastVerified: number
}

export class TwoFAManager {
  private sessions: Map<string, TwoFASession> = new Map()

  createSession(userId: string): TwoFASession {
    const { secret } = generateTOTPSecret(userId)

    const session: TwoFASession = {
      userId,
      secret,
      backupCodes: generateBackupCodes(10),
      usedBackupCodes: [],
      enabled: false,
      createdAt: Date.now(),
      lastVerified: 0,
    }

    this.sessions.set(userId, session)
    return session
  }

  getSession(userId: string): TwoFASession | undefined {
    return this.sessions.get(userId)
  }

  verifyAndEnable(userId: string, token: string): boolean {
    const session = this.sessions.get(userId)
    if (!session) return false

    const result = verifyTOTPToken(session.secret, token)
    if (result.isValid) {
      session.enabled = true
      session.lastVerified = Date.now()
      return true
    }

    return false
  }

  verify(userId: string, token: string): boolean {
    const session = this.sessions.get(userId)
    if (!session || !session.enabled) return false

    const result = verifyTOTPToken(session.secret, token)
    if (result.isValid) {
      session.lastVerified = Date.now()
      return true
    }

    return false
  }

  verifyBackup(userId: string, code: string): boolean {
    const session = this.sessions.get(userId)
    if (!session || !session.enabled) return false

    const isValid = verifyBackupCode(
      session.usedBackupCodes,
      session.backupCodes,
      code
    )

    if (isValid) {
      session.usedBackupCodes.push(code.toUpperCase())
      session.lastVerified = Date.now()
    }

    return isValid
  }

  disable(userId: string): boolean {
    const session = this.sessions.get(userId)
    if (!session) return false

    session.enabled = false
    this.sessions.delete(userId)
    return true
  }

  getRemainingSessions(userId: string): number {
    const session = this.sessions.get(userId)
    if (!session || !session.enabled) return 0
    return getRemainingCodes(session.usedBackupCodes, session.backupCodes.length)
  }
}

// Export default instance
export const twoFAManager = new TwoFAManager()
export const twoFALimiter = new TwoFAAttemptLimiter()
