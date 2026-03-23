import { useCallback, useRef, useEffect, useState } from 'react'

/**
 * Hook para Rate Limiting com Debounce
 * Protege contra spam e requisições duplicadas
 */

interface RateLimitConfig {
  maxRequests: number
  per: number // milliseconds
  debounce?: number // milliseconds
}

interface RateLimitState {
  count: number
  resetTime: number
  isLimited: boolean
}

export function useRateLimit(config: RateLimitConfig) {
  const [state, setState] = useState<RateLimitState>({
    count: 0,
    resetTime: Date.now() + config.per,
    isLimited: false,
  })

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const requestQueueRef = useRef<(() => void)[]>([])

  /**
   * Executa função com rate limit
   */
  const execute = useCallback(
    (fn: () => void | Promise<void>) => {
      return new Promise<void>((resolve, reject) => {
        const now = Date.now()

        // Reset se fora da janela
        if (now > state.resetTime) {
          setState({
            count: 1,
            resetTime: now + config.per,
            isLimited: false,
          })
          return execute(fn).then(resolve).catch(reject)
        }

        // Verificar se atingiu limite
        if (state.count >= config.maxRequests) {
          setState((prev) => ({ ...prev, isLimited: true }))
          const waitTime = state.resetTime - now
          reject(new Error(`Rate limited. Wait ${Math.ceil(waitTime / 1000)}s`))
          return
        }

        // Atualizar contador
        setState((prev) => ({
          ...prev,
          count: prev.count + 1,
          isLimited: prev.count + 1 >= config.maxRequests,
        }))

        // Debounce se configurado
        if (config.debounce) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
          }

          debounceTimerRef.current = setTimeout(async () => {
            try {
              await fn()
              resolve()
            } catch (error) {
              reject(error)
            }
          }, config.debounce)
        } else {
          // Executar imediatamente
          try {
            fn()
            resolve()
          } catch (error) {
            reject(error)
          }
        }
      })
    },
    [state, config]
  )

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Reset manual
   */
  const reset = useCallback(() => {
    setState({
      count: 0,
      resetTime: Date.now() + config.per,
      isLimited: false,
    })
  }, [config.per])

  /**
   * Tempo restante até reset
   */
  const timeUntilReset = Math.max(0, state.resetTime - Date.now())

  return {
    execute,
    reset,
    isLimited: state.isLimited,
    count: state.count,
    maxRequests: config.maxRequests,
    timeUntilReset,
    remainingRequests: Math.max(0, config.maxRequests - state.count),
  }
}

/**
 * Hook para Debounce de valor
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para Debounce de função
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedFn = useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        fn(...args)
      }, delay)
    }) as T,
    [fn, delay]
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }, [])

  return { fn: debouncedFn, cancel }
}

/**
 * Hook para Throttle de evento
 */
export function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const lastTimeRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback(
    ((...args) => {
      const now = Date.now()
      const timeSinceLastCall = now - lastTimeRef.current

      if (timeSinceLastCall >= delay) {
        lastTimeRef.current = now
        fn(...args)
      } else {
        // Schedule para próximo intervalo
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
          lastTimeRef.current = Date.now()
          fn(...args)
        }, delay - timeSinceLastCall)
      }
    }) as T,
    [fn, delay]
  )
}

/**
 * Hook para Double-click protection
 */
export function useClickProtection(delay: number = 300) {
  const lastClickRef = useRef<number>(0)
  const [isProtected, setIsProtected] = useState(false)

  const onClick = useCallback(() => {
    const now = Date.now()
    const timeSinceLastClick = now - lastClickRef.current

    if (timeSinceLastClick < delay) {
      // Second click too soon - blocked
      setIsProtected(true)
      setTimeout(() => setIsProtected(false), delay)
      return false
    }

    lastClickRef.current = now
    return true
  }, [delay])

  return { onClick, isProtected }
}
