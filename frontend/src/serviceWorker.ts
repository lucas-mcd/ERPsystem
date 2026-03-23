// Service Worker para PWA com suporte offline e cache

const CACHE_NAME = 'erp-app-v1'
const API_CACHE = 'erp-api-v1'
const ASSET_CACHE = 'erp-assets-v1'

// Assets que devem ser cacheados no install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
]

// Event: Install - cache resources
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Installing...')

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell')
        // Adicionar assets com tratamento de erro individual
        return Promise.all(
          ASSETS_TO_CACHE.map((url) =>
            fetch(url)
              .then((response) => {
                if (response.ok) {
                  return cache.put(url, response)
                }
                return null
              })
              .catch((err) => {
                console.warn(`[ServiceWorker] Failed to cache ${url}:`, err)
                return null
              })
          )
        )
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting')
        return self.skipWaiting()
      })
      .catch((err) => {
        console.error('[ServiceWorker] Install error:', err)
      })
  )
})

// Event: Activate - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[ServiceWorker] Activating...')

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return (
                cacheName !== CACHE_NAME &&
                cacheName !== API_CACHE &&
                cacheName !== ASSET_CACHE
              )
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('[ServiceWorker] Claiming clients')
        return self.clients.claim()
      })
  )
})

// Event: Fetch - network first with fallback to cache
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Handle API requests (with 'api' in path)
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response to cache it
          if (response.ok) {
            const cache = caches.open(API_CACHE)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // Fallback to cache on network failure
          return (
            caches
              .match(request)
              .then(
                (cachedResponse) =>
                  cachedResponse ||
                  new Response('Offline - API not available', {
                    status: 503,
                    statusText: 'Service Unavailable',
                  })
              )
          )
        })
    )
    return
  }

  // Handle static assets (cache first)
  if (
    request.url.includes('.js') ||
    request.url.includes('.css') ||
    request.url.includes('.png') ||
    request.url.includes('.jpg') ||
    request.url.includes('.svg') ||
    request.url.includes('.woff')
  ) {
    event.respondWith(
      caches
        .match(request)
        .then((response) => {
          if (response) {
            return response
          }

          return fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response
            }

            // Cache the new response
            const cache = caches.open(ASSET_CACHE)
            cache.then((c) => c.put(request, response.clone()))

            return response
          })
        })
        .catch(() => {
          // Return a fallback for failed assets
          if (request.destination === 'image') {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#999">No Image</text></svg>',
              {
                headers: { 'Content-Type': 'image/svg+xml' },
              }
            )
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          })
        })
    )
    return
  }

  // Handle HTML/documents (network first with cache fallback)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const cache = caches.open(CACHE_NAME)
          cache.then((c) => c.put(request, response.clone()))
        }
        return response
      })
      .catch(() => {
        return (
          caches
            .match(request)
            .then((response) => {
              if (response) {
                return response
              }

              // If index.html is not cached, return offline page
              if (
                request.mode === 'navigate' ||
                request.destination === 'document'
              ) {
                return caches.match('/index.html').then((response) => {
                  return (
                    response ||
                    new Response(
                      '<h1>Offline</h1><p>The app is not available offline yet.</p>',
                      {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: {
                          'Content-Type': 'text/html; charset=utf-8',
                        },
                      }
                    )
                  )
                })
              }

              return new Response('Not found', {
                status: 404,
                statusText: 'Not Found',
              })
            })
        )
      })
  )
})

// Event: Message - handle skipWaiting from client
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Cache clearing
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          )
        })
        .then(() => {
          event.ports[0]?.postMessage({ success: true })
        })
    )
  }
})

export {}
