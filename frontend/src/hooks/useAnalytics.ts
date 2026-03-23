import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAnalytics, type EventCategory, type AnalyticsEvent } from '@/utils/analytics'
import { useAuth } from '@/context/AuthContext'

/**
 * Hook para rastreamento de eventos
 */
export function useAnalytics() {
  const analytics = getAnalytics()
  const { user } = useAuth()

  // Rastrear mudança de página
  const location = useLocation()
  useEffect(() => {
    analytics.pageView(location.pathname, document.title)
  }, [location.pathname, analytics])

  // Rastrear usuário logado
  useEffect(() => {
    if (user) {
      analytics.setUserId(user.id)
      analytics.setUserProperties({
        role: user.role,
        email: user.email,
        name: user.name,
      })
    }
  }, [user, analytics])

  return {
    /**
     * Rastreia um evento genérico
     */
    track: (category: EventCategory, action: string, options?: Omit<AnalyticsEvent, 'category' | 'action'>) => {
      analytics.track(category, action, options)
    },

    /**
     * Rastreia navegação
     */
    trackNavigation: (page: string) => {
      analytics.track('navigation', 'navigate', { label: page })
    },

    /**
     * R astreia clique em elemento
     */
    trackClick: (element: string, properties?: Record<string, any>) => {
      analytics.track('engagement', 'click', { label: element, properties })
    },

    /**
     * Rastreia criação
     */
    trackCreate: (resource: string) => {
      analytics.trackCreate(resource)
    },

    /**
     * Rastreia atualização
     */
    trackUpdate: (resource: string) => {
      analytics.trackUpdate(resource)
    },

    /**
     * Rastreia remoção
     */
    trackDelete: (resource: string) => {
      analytics.trackDelete(resource)
    },

    /**
     * Rastreia export
     */
    trackExport: (format: string) => {
      analytics.trackExport(format)
    },

    /**
     * Rastreia busca
     */
    trackSearch: (query: string) => {
      analytics.trackSearch(query)
    },

    /**
     * Rastreia filtro
     */
    trackFilter: (filterName: string) => {
      analytics.trackFilter(filterName)
    },

    /**
     * Rastreia erro
     */
    trackError: (error: string, code?: string) => {
      analytics.trackError(error, code)
    },

    /**
     * Rastreia performance
     */
    trackPerformance: (metric: string, value: number) => {
      analytics.trackPerformance(metric, value)
    },
  }
}
