import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type ThemeType = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: 'light' | 'dark'
  themeMode: ThemeType
  toggleTheme: () => void
  setTheme: (theme: ThemeType) => void
  resetToSystemTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'erp_theme_preference'

/**
 * Detecta a preferência de tema do sistema operacional
 */
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Obtém o tema atual baseado na preferência armazenada ou do SO
 */
function getTheme(themeMode: ThemeType): 'light' | 'dark' {
  if (themeMode === 'system') {
    return getSystemTheme()
  }
  return themeMode as 'light' | 'dark'
}

/**
 * Aplica classes Tailwind e variáveis CSS ao documento
 */
function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement

  // Remove temas anteriores
  html.classList.remove('light', 'dark')
  // Adiciona tema atual
  html.classList.add(theme)

  // Tailwind: adiciona 'dark' a html se theme for 'dark'
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }

  // Variáveis CSS para o tema
  const cssVars = theme === 'dark' ? darkModeVars : lightModeVars
  Object.entries(cssVars).forEach(([key, value]) => {
    html.style.setProperty(key, value)
  })

  // Meta theme-color
  const metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'dark' ? '#1f2937' : '#ffffff'
    )
  }
}

/**
 * Variáveis CSS para modo claro
 */
const lightModeVars: Record<string, string> = {
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#f9fafb',
  '--color-bg-tertiary': '#f3f4f6',
  '--color-text': '#111827',
  '--color-text-secondary': '#6b7280',
  '--color-text-tertiary': '#9ca3af',
  '--color-border': '#e5e7eb',
  '--color-border-light': '#f3f4f6',
  '--color-input': '#ffffff',
  '--color-input-border': '#d1d5db',
  '--color-shadow': 'rgba(0, 0, 0, 0.1)',
}

/**
 * Variáveis CSS para modo escuro
 */
const darkModeVars: Record<string, string> = {
  '--color-bg': '#0f172a',
  '--color-bg-secondary': '#1e293b',
  '--color-bg-tertiary': '#334155',
  '--color-text': '#f1f5f9',
  '--color-text-secondary': '#cbd5e1',
  '--color-text-tertiary': '#94a3b8',
  '--color-border': '#475569',
  '--color-border-light': '#1e293b',
  '--color-input': '#1e293b',
  '--color-input-border': '#475569',
  '--color-shadow': 'rgba(0, 0, 0, 0.3)',
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeType>('system')
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Inicializar tema do localStorage ou sistema
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | ThemeType
      | null

    const mode = savedTheme || 'system'
    setThemeMode(mode)

    const computedTheme = getTheme(mode)
    setThemeState(computedTheme)
    applyTheme(computedTheme)

    setMounted(true)
  }, [])

  // Sincronizar com preferência do SO se theme for 'system'
  useEffect(() => {
    if (themeMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light'
      setThemeState(newTheme)
      applyTheme(newTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  // Sincronizar com mudanças em outras abas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const newThemeMode = e.newValue as ThemeType
        setThemeMode(newThemeMode)

        const computedTheme = getTheme(newThemeMode)
        setThemeState(computedTheme)
        applyTheme(computedTheme)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Persistir mudança de tema
  const handleSetTheme = (newThemeMode: ThemeType) => {
    setThemeMode(newThemeMode)
    localStorage.setItem(THEME_STORAGE_KEY, newThemeMode)

    const computedTheme = getTheme(newThemeMode)
    setThemeState(computedTheme)
    applyTheme(computedTheme)
  }

  // Toggle entre light e dark
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    handleSetTheme(nextTheme)
  }

  // Resetar para preferência do SO
  const resetToSystemTheme = () => {
    handleSetTheme('system')
  }

  // Não renderizar até o tema ser inicializado (evita flash)
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        toggleTheme,
        setTheme: handleSetTheme,
        resetToSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const getThemeColors = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      bg: '#0f172a',
      bgSecondary: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#475569',
      input: '#1e293b',
      inputBorder: '#475569',
    }
  }
  return {
    bg: '#ffffff',
    bgSecondary: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    input: '#ffffff',
    inputBorder: '#d1d5db',
  }
}
