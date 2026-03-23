# PWA Deployment Guide

## Pré-requisitos

- Node.js 16+
- npm 8+
- HTTPS em produção (obrigatório para Service Worker)
- Vite 4+ (já configurado)

## Setup Local Development

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Verificar Configuração

```typescript
// vite.config.ts
export default defineConfig({
  // ...
  server: {
    https: false // dev usa HTTP
  }
})
```

### 3. Rodar Localmente

```bash
npm run dev
```

Acesse `http://localhost:5173`

### 4. Simular Service Worker em Development

```bash
# Build para produção e servir localmente
npm run build
npm run preview

# Acesse https://localhost:4173
# DevTools → Application → Service Workers
```

## Deployment em Produção

### Requisitos HTTPS

**Service Worker SÓ funciona com HTTPS**

```bash
# Gerar certificado self-signed para teste
openssl req -x509 -newkey rsa:4096 -nodes \
  -out cert.pem -keyout key.pem -days 365
```

### Build Otimizado

```bash
npm run build
# Outputs:
# - dist/index.html
# - dist/*.js (code splitting)
# - dist/*.css
# - dist/manifest.json
# - dist/serviceWorker.js
```

### Checklist de Deployment

- [ ] HTTPS configurado
- [ ] `manifest.json` na raiz publica
- [ ] `serviceWorker.ts` compilado
- [ ] Icons configurados em `manifest.json`
- [ ] Teste offline em DevTools
- [ ] Teste instalação em mobile

### Exemplo: Dockerfile

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# HTTPS setup
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000", "-k", "/certs/key.pem", "-c", "/certs/cert.pem"]
```

### Exemplo: Deploy Vercel

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "frontend/dist",
  "env": {
    "VITE_API_URL": "https://api.example.com"
  },
  "headers": [
    {
      "source": "/manifest.json",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    },
    {
      "source": "/serviceWorker.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

### Exemplo: GitHub Pages (com service worker fix)

```bash
# gh-pages setup
npm install --save-dev gh-pages

# Update package.json
{
  "homepage": "https://username.github.io/repo",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}

# Deploy
npm run deploy
```

## Testing em Diferentes Ambientes

### Linux/Mac - Simular HTTPS

```bash
# Usar mkcert
brew install mkcert
mkcert localhost

# Servir com HTTPS
python3 -m http.server 8000 --directory dist
```

### Windows - Simular HTTPS

```bash
# Usar IIS Express ou Caddy
choco install caddy

# Caddyfile
localhost:443 {
  root * dist
  file_server
}

caddy run
```

### Mobile Testing

```bash
# Expor local para mobile
npx ngrok http 5173

# Acesso via: https://seu-ngrok-url.ngrok.io
```

## Monitoramento

### Verificar Service Worker Status

```javascript
navigator.serviceWorker.ready.then(reg => {
  console.log('SW Active:', reg.active)
  console.log('SW Waiting:', reg.waiting)
  console.log('Updates:', reg.updates)
})
```

### Verificar Cache Storage

```javascript
caches.keys().then(names => {
  console.log('Cache names:', names)
  // 'erp-app-v1'
  // 'erp-api-cache'
  // 'erp-assets-cache'
})
```

### Logs de Sync Offline

```javascript
// No Service Worker
console.log('[SW] Request queued:', method, url)
console.log('[SW] Syncing offline queue...')
console.log('[SW] Cache hit:', url)
console.log('[SW] Fallback response')
```

## Performance Optimization

### Code Splitting

```typescript
// main.tsx - lazy load heavy components
const ReportsPage = lazy(() => import('@/pages/ReportsPage'))
const AuditLogsPage = lazy(() => import('@/pages/AuditLogsPage'))

// Com Suspense
<Suspense fallback={<LoadingSpinner />}>
  <ReportsPage />
</Suspense>
```

### Asset Optimization

```bash
# Verificar bundle size
npm run build -- --report

# Compress images
npx imagemin dist/img --out-dir=dist/img

# Minify CSS
npm install -D csso-cli
csso dist/*.css -o dist
```

### Cache Headers

```
# .htaccess (Apache)
<FilesMatch "\.(js|css|woff|woff2|ttf|svg)$">
  Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

<FilesMatch "\.(html|json)$">
  Header set Cache-Control "public, max-age=0, must-revalidate"
</FilesMatch>

# nginx.conf
location ~* \.(js|css|woff|woff2|ttf|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location ~* \.(html|json|manifest)$ {
  expires -1;
  add_header Cache-Control "public, max-age=0, must-revalidate";
}
```

## Troubleshooting Deployment

### Service Worker não registra

```javascript
navigator.serviceWorker.register('/serviceWorker.js')
  .catch(err => console.error('SW Registration failed:', err))
```

**Solução**:
- ✅ Verificar HTTPS
- ✅ Verificar caminho do arquivo
- ✅ Verificar MIME type (application/javascript)
- ✅ Verificar CORS headers

### Cache desatualizado

```javascript
// Forçar cache update
registration.unregister()
caches.delete('erp-app-v1')
location.reload()
```

### Offline mode funciona local mas não em produção

**Causas**:
- ❌ Service Worker não registrou
- ❌ Cache não criado
- ❌ HTTPS não ativado

**Debug**:
```bash
# Chrome DevTools
Application → Service Workers → inspect
Application → Cache Storage
```

## Versioning

### Estratégia de Versão

```typescript
// serviceWorker.ts
const CACHE_VERSION = '1'
const CACHE_NAME = `erp-app-v${CACHE_VERSION}`

// Incrementar em cada release significativo
// v1 → v2 quando mudar estrutura
```

### Update Management

```javascript
// Monitorar updates
navigator.serviceWorker.oncontrollerchange = () => {
  // Nova versão ativa
  // Mostrar notificação
  window.dispatchEvent(new Event('swupdate'))
}
```

## Rollback

Se probleminha ocorrer:

```bash
# 1. Desativar Service Worker
navigator.serviceWorker.getRegistrations()
  .then(regs => regs.forEach(r => r.unregister()))

# 2. Deploy versão anterior
git revert <commit>
npm run build && deploy

# 3. Limpar caches
caches.keys().then(names =>
  Promise.all(names.map(n => caches.delete(n)))
)
```

## Métricas & Analytics

### Coletar dados de uso offline

```typescript
// track.ts
function logOfflineUsage(action: string, resource: string) {
  const log = {
    timestamp: Date.now(),
    action,
    resource,
    online: navigator.onLine
  }
  
  // Armazenar localmente
  const logs = JSON.parse(localStorage.getItem('usage_logs') || '[]')
  logs.push(log)
  localStorage.setItem('usage_logs', JSON.stringify(logs))
  
  // Enviar quando online
  if (navigator.onLine) {
    navigator.sendBeacon('/api/analytics', JSON.stringify(logs))
  }
}
```

## Documentação

- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [MDN Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Google Developers PWA](https://developers.google.com/web/progressive-web-apps)

## Suporte

Para problemas de PWA:

```bash
# Verificar console do browser
F12 → Console → Check for errors

# Verificar Service Worker
F12 → Application → Service Workers

# Verificar Cache
F12 → Application → Cache Storage

# Limpar dados
F12 → Application → Clear site data
```
