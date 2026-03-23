import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Language } from './translations'
import { t } from './translations'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, values?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
  defaultLanguage?: Language
}

/**
 * Provider para i18n
 */
export function I18nProvider({ children, defaultLanguage = 'pt' }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('language')
    return (stored as Language) || defaultLanguage
  })

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    document.documentElement.lang = lang
  }

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const value: I18nContextType = {
    language,
    setLanguage,
    t: (key, values) => t(key, values, language),
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Hook para usar i18n
 */
export function useI18n(): I18nContextType {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n deve ser usado dentro de I18nProvider')
  }
  return context
}

/**
 * Hook simplificado apenas para tradução
 */
export function useTranslation() {
  const { t: translate, language } = useI18n()
  return { t: translate, language }
}
