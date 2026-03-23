import React from 'react'
import { Globe } from 'lucide-react'
import { useI18n, type Language } from '@/contexts/I18nContext'

/**
 * Componente para selecionar idioma
 */
export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n()

  const languages: { id: Language; label: string }[] = [
    { id: 'pt', label: 'Português' },
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
  ]

  return (
    <div className="flex items-center gap-3">
      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * Versão em formato de botões
 */
export function LanguageSelectorButtons() {
  const { language, setLanguage } = useI18n()

  const languages: { id: Language; label: string; flag: string }[] = [
    { id: 'pt', label: 'PT', flag: '🇧🇷' },
    { id: 'en', label: 'EN', flag: '🇺🇸' },
    { id: 'es', label: 'ES', flag: '🇪🇸' },
  ]

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.id}
          onClick={() => setLanguage(lang.id)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            language === lang.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          <span className="mr-1">{lang.flag}</span>
          {lang.label}
        </button>
      ))}
    </div>
  )
}
