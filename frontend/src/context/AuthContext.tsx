import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, AuthContextType, TokenResponse } from '@/types'
import { activityLogger } from '@/lib/activityLogger'
import { twoFALimiter } from '@/lib/twoFAManager'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provider de Autenticação
 * 
 * Gerencia:
 * - Estado de autenticação
 * - Token JWT
 * - Dados do usuário autenticado
 * - Fluxo de 2FA
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresTwoFA, setRequiresTwoFA] = useState(false)
  const [twoFAUserId, setTwoFAUserId] = useState<string | null>(null)
  const [tempToken, setTempToken] = useState<string | null>(null)

  // Recuperar token do localStorage ao inicializar
  useEffect(() => {
    console.log('[Auth] Initializing...')
    const savedToken = localStorage.getItem('token')
    console.log('[Auth] Saved token:', savedToken ? `${savedToken.slice(0, 20)}...` : 'none')
    if (savedToken) {
      setToken(savedToken)
      // Validar token buscando dados do usuário
      validateToken(savedToken)
    } else {
      console.log('[Auth] No token found, user not authenticated')
      setLoading(false)
    }
  }, [])

  /**
   * Valida o token fazendo uma requisição autenticada
   */
  async function validateToken(authToken: string) {
    try {
      console.log('[Auth] Validating token...')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      console.log('[Auth] Validation response:', response.status, response.statusText)

      if (response.ok) {
        const userData = await response.json()
        console.log('[Auth] Token valid, user:', userData.email)
        setUser(userData)
      } else {
        // Token inválido
        console.log('[Auth] Token invalid')
        localStorage.removeItem('token')
        setToken(null)
      }
    } catch (err) {
      console.error('[Auth] Error validating token:', err)
      localStorage.removeItem('token')
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Realiza login do usuário
   */
  async function login(email: string, password: string) {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        activityLogger.log(
          email,
          email.split('@')[0],
          email,
          'FAILED_LOGIN',
          'USER',
          {
            status: 'failed',
            errorMessage: errorData.error?.message || 'Login failed',
          }
        )
        throw new Error(errorData.error?.message || 'Login failed')
      }

      const data: TokenResponse = await response.json()

      // Check if 2FA is required
      if (data.requires_2fa) {
        setRequiresTwoFA(true)
        setTwoFAUserId(email)
        setTempToken(data.temp_token || '')
        return
      }
      
      // Salvar token
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      setTempToken(null)
      setRequiresTwoFA(false)

      // Buscar dados do usuário
      await validateToken(data.access_token)
      
      // Log successful login
      activityLogger.log(
        email,
        email.split('@')[0],
        email,
        'LOGIN',
        'USER',
        { status: 'success' }
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verifica token de 2FA
   */
  async function verify2FA(token: string) {
    try {
      setError(null)
      setLoading(true)

      if (!twoFAUserId) {
        throw new Error('2FA session not initialized')
      }

      // Record attempt for rate limiting
      twoFALimiter.recordAttempt(twoFAUserId)

      // Check if locked
      if (twoFALimiter.isLocked(twoFAUserId)) {
        const remaining = twoFALimiter.getUnlockTime(twoFAUserId)
        activityLogger.log(
          twoFAUserId,
          twoFAUserId.split('@')[0],
          twoFAUserId,
          'FAILED_LOGIN',
          'USER',
          {
            status: 'failed',
            errorMessage: `Too many 2FA attempts. Try again in ${Math.ceil(
              remaining / 1000
            )} seconds`,
          }
        )
        throw new Error('Too many attempts. Please try again later.')
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/auth/verify-2fa`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tempToken}`,
          },
          body: JSON.stringify({ token }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        activityLogger.log(
          twoFAUserId,
          twoFAUserId.split('@')[0],
          twoFAUserId,
          'FAILED_LOGIN',
          'USER',
          {
            status: 'failed',
            errorMessage: 'Invalid 2FA token',
          }
        )
        throw new Error(errorData.error?.message || '2FA verification failed')
      }

      const data: TokenResponse = await response.json()

      // Salvar token
      localStorage.setItem('token', data.access_token)
      setToken(data.access_token)
      setTempToken(null)
      setRequiresTwoFA(false)
      setTwoFAUserId(null)

      // Buscar dados do usuário
      await validateToken(data.access_token)

      // Reset rate limiter
      twoFALimiter.reset(twoFAUserId)

      // Log successful 2FA verification
      activityLogger.log(
        twoFAUserId,
        twoFAUserId.split('@')[0],
        twoFAUserId,
        'LOGIN',
        'USER',
        { status: 'success', details: { twoFactorVerified: true } }
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : '2FA verification failed'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Realiza logout do usuário
   */
  function logout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    setError(null)
    setRequiresTwoFA(false)
    setTwoFAUserId(null)
    setTempToken(null)
    
    activityLogger.log(
      user?.id.toString() || 'unknown',
      user?.full_name || 'Unknown',
      user?.email || 'unknown@example.com',
      'LOGOUT',
      'USER',
      { status: 'success' }
    )
  }

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    verify2FA,
    logout,
    isAuthenticated: !!token && !!user,
    requiresTwoFA,
    twoFAUserId: twoFAUserId || undefined,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para acessar contexto de autenticação
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
