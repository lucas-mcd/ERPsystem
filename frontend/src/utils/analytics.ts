/**
 * Sistema de Analytics para rastreamento de eventos
 * Suporta múltiplos provedores (Google Analytics, Mixpanel, etc.)
 */

export type EventCategory = 
  | 'navigation'
  | 'user'
  | 'content'
  | 'engagement'
  | 'conversion'
  | 'error'
  | 'performance'

export type EventAction = string

export interface AnalyticsEvent {
  category: EventCategory
  action: EventAction
  label?: string
  value?: number
  properties?: Record<string, any>
}

interface AnalyticsProvider {
  trackEvent: (event: AnalyticsEvent) => void
  setUserId: (userId: string) => void
  setUserProperties: (properties: Record<string, any>) => void
  pageView: (path: string, title: string) => void
}

/**
 * Mock provider para desenvolvimento
 */
class MockAnalyticsProvider implements AnalyticsProvider {
  trackEvent(event: AnalyticsEvent) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event)
    }
  }

  setUserId(userId: string) {
    console.log('[Analytics] User ID:', userId)
  }

  setUserProperties(properties: Record<string, any>) {
    console.log('[Analytics] Properties:', properties)
  }

  pageView(path: string, title: string) {
    console.log('[Analytics] Page View:', { path, title })
  }
}

/**
 * Google Analytics provider
 */
class GoogleAnalyticsProvider implements AnalyticsProvider {
  private measurementId: string

  constructor(measurementId: string) {
    this.measurementId = measurementId
    this.initializeGA()
  }

  private initializeGA() {
    // Load Google Analytics script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    gtag('js', new Date())
    gtag('config', this.measurementId)
  }

  trackEvent(event: AnalyticsEvent) {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.properties,
      })
    }
  }

  setUserId(userId: string) {
    if (typeof gtag !== 'undefined') {
      gtag('set', { 'user_id': userId })
    }
  }

  setUserProperties(properties: Record<string, any>) {
    if (typeof gtag !== 'undefined') {
      gtag('set', properties)
    }
  }

  pageView(path: string, title: string) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
      })
    }
  }
}

/**
 * Manager central de analytics
 */
class AnalyticsManager {
  private provider: AnalyticsProvider

  constructor(provider?: AnalyticsProvider) {
    this.provider = provider || new MockAnalyticsProvider()
  }

  /**
   * Rastreia um evento
   */
  track(category: EventCategory, action: EventAction, options?: Omit<AnalyticsEvent, 'category' | 'action'>) {
    this.provider.trackEvent({
      category,
      action,
      ...options,
    })
  }

  /**
   * Rastreia navegação
   */
  trackNavigation(page: string) {
    this.track('navigation', 'page_view', { label: page })
  }

  /**
   * Rastreia login
   */
  trackLogin(method: string = 'email') {
    this.track('user', 'login', { label: method })
  }

  /**
   * Rastreia logout
   */
  trackLogout() {
    this.track('user', 'logout')
  }

  /**
   * Rastreia criação de recurso
   */
  trackCreate(resource: string) {
    this.track('content', 'create', { label: resource })
  }

  /**
   * Rastreia atualização de recurso
   */
  trackUpdate(resource: string) {
    this.track('content', 'update', { label: resource })
  }

  /**
   * Rastreia deleção de recurso
   */
  trackDelete(resource: string) {
    this.track('content', 'delete', { label: resource })
  }

  /**
   * Rastreia export de dados
   */
  trackExport(format: string) {
    this.track('engagement', 'export', { label: format })
  }

  /**
   * Rastreia busca
   */
  trackSearch(query: string) {
    this.track('engagement', 'search', { label: query })
  }

  /**
   * Rastreia filtro
   */
  trackFilter(filterName: string) {
    this.track('engagement', 'filter', { label: filterName })
  }

  /**
   * Rastreia erro
   */
  trackError(errorMessage: string, errorCode?: string) {
    this.track('error', 'error_occurred', { label: errorMessage, properties: { code: errorCode } })
  }

  /**
   * Rastreia performance
   */
  trackPerformance(metric: string, value: number) {
    this.track('performance', metric, { value })
  }

  /**
   * Define ID do usuário
   */
  setUserId(userId: string) {
    this.provider.setUserId(userId)
  }

  /**
   * Define propriedades do usuário
   */
  setUserProperties(properties: Record<string, any>) {
    this.provider.setUserProperties(properties)
  }

  /**
   * Registra page view
   */
  pageView(path: string, title: string) {
    this.provider.pageView(path, title)
  }

  /**
   * Muda provider
   */
  setProvider(provider: AnalyticsProvider) {
    this.provider = provider
  }
}

// Singleton instance
let analyticsManager: AnalyticsManager | null = null

/**
 * Obtém instância do analytics manager
 */
export function getAnalytics(provider?: AnalyticsProvider): AnalyticsManager {
  if (!analyticsManager) {
    analyticsManager = new AnalyticsManager(provider)
  }
  return analyticsManager
}

// Tipos globais
declare global {
  interface Window {
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
  }
}

export { AnalyticsManager, type AnalyticsProvider, GoogleAnalyticsProvider }
