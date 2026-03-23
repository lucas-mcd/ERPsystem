/**
 * Web Vitals Monitoring
 * Rastreia Core Web Vitals e performance metrics
 */

import { getAnalytics } from './analytics'

interface IdleDeadline {
  readonly didTimeout: boolean
  timeRemaining(): DOMHighResTimeStamp
}

/**
 * Métricas dos Core Web Vitals
 */
export interface WebVitals {
  LCP: number | null  // Largest Contentful Paint
  FID: number | null  // First Input Delay
  CLS: number | null  // Cumulative Layout Shift
  TTFB: number | null // Time to First Byte
  FCP: number | null  // First Contentful Paint
}

const vitals: WebVitals = {
  LCP: null,
  FID: null,
  CLS: null,
  TTFB: null,
  FCP: null,
}

/**
 * Rastreia LCP (Largest Contentful Paint)
 */
export function reportLCP() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        const lcp = (lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime) as number

        vitals.LCP = lcp

        // Enviar para analytics
        getAnalytics().trackPerformance('LCP', lcp)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })

      // Desconectar após 15s
      const timer = setTimeout(() => observer.disconnect(), 15000)
      return () => {
        clearTimeout(timer)
        observer.disconnect()
      }
    } catch (error) {
      console.error('Failed to observe LCP:', error)
    }
  }
}

/**
 * Rastreia FID (First Input Delay)
 */
export function reportFID() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fid = (entry as any).processingDuration || (entry as any).duration || 0

          vitals.FID = fid

          // Enviar para analytics
          getAnalytics().trackPerformance('FID', fid)
        })
      })

      observer.observe({ entryTypes: ['first-input'] })

      return () => observer.disconnect()
    } catch (error) {
      console.error('Failed to observe FID:', error)
    }
  }

  // Fallback para INP (Interaction to Next Paint)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        const inp = (lastEntry as PerformanceEventTiming).duration

        vitals.FID = inp
        getAnalytics().trackPerformance('INP', inp)
      })

      observer.observe({ entryTypes: ['interaction'] })

      return () => observer.disconnect()
    } catch {
      // Ignore
    }
  }
}

/**
 * Rastreia CLS (Cumulative Layout Shift)
 */
export function reportCLS() {
  if ('PerformanceObserver' in window) {
    try {
      let cls = 0

      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value

            vitals.CLS = cls

            // Enviar para analytics
            getAnalytics().trackPerformance('CLS', cls)
          }
        })
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      return () => observer.disconnect()
    } catch (error) {
      console.error('Failed to observe CLS:', error)
    }
  }
}

/**
 * Rastreia FCP (First Contentful Paint)
 */
export function reportFCP() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const fcp = entries[0].startTime

        vitals.FCP = fcp

        // Enviar para analytics
        getAnalytics().trackPerformance('FCP', fcp)

        observer.disconnect()
      })

      observer.observe({ entryTypes: ['paint'] })

      return () => observer.disconnect()
    } catch (error) {
      console.error('Failed to observe FCP:', error)
    }
  }
}

/**
 * Rastreia TTFB (Time to First Byte)
 */
export function reportTTFB() {
  if ('PerformanceNavigationTiming' in window) {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

      if (navigation) {
        const ttfb = navigation.responseStart - navigation.fetchStart

        vitals.TTFB = ttfb

        // Enviar para analytics
        getAnalytics().trackPerformance('TTFB', ttfb)
      }
    } catch (error) {
      console.error('Failed to measure TTFB:', error)
    }
  }
}

/**
 * Inicializa todos os Web Vitals
 */
export function initWebVitals() {
  reportLCP()
  reportFID()
  reportCLS()
  reportFCP()
  reportTTFB()
}

/**
 * Obtém métricas de vitals
 */
export function getWebVitals(): WebVitals {
  return { ...vitals }
}

/**
 * Verifica se vitals estão dentro do bom padrão
 */
export function checkWebVitalsHealth(): {
  LCP: 'good' | 'needs-improvement' | 'poor' | 'not-measured'
  FID: 'good' | 'needs-improvement' | 'poor' | 'not-measured'
  CLS: 'good' | 'needs-improvement' | 'poor' | 'not-measured'
} {
  return {
    LCP:
      vitals.LCP === null
        ? 'not-measured'
        : vitals.LCP < 2500
          ? 'good'
          : vitals.LCP < 4000
            ? 'needs-improvement'
            : 'poor',
    FID:
      vitals.FID === null
        ? 'not-measured'
        : vitals.FID < 100
          ? 'good'
          : vitals.FID < 300
            ? 'needs-improvement'
            : 'poor',
    CLS:
      vitals.CLS === null
        ? 'not-measured'
        : vitals.CLS < 0.1
          ? 'good'
          : vitals.CLS < 0.25
            ? 'needs-improvement'
            : 'poor',
  }
}
