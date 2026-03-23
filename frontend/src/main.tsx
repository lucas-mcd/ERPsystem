import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './styles/globals.css'
import { initSentry } from './utils/sentry'
import { initWebVitals } from './utils/webVitals'
import { getQueryClient } from './utils/queryClient'

// Initialize Sentry for error tracking
initSentry()

// Initialize Web Vitals monitoring
initWebVitals()

// Get QueryClient instance
const queryClient = getQueryClient()

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      new URL('./serviceWorker.ts', import.meta.url),
      { type: 'module' }
    ).then((registration) => {
      console.log('[PWA] Service Worker registered:', registration)

      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60000) // Check every minute
    }).catch((error) => {
      console.error('[PWA] Service Worker registration failed:', error)
    })

    // Listen for new service worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[PWA] Service Worker updated')
      // Show update notification to user
      window.dispatchEvent(new Event('swupdate'))
    })
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
