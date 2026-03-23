#!/bin/bash

# PWA Health Check Script
# Verifica se todos os componentes PWA estão configurados corretamente

set -e

echo "🔍 Verificando configuração PWA..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASSED=0
FAILED=0
WARNINGS=0

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $2 (missing: $1)"
    ((FAILED++))
  fi
}

check_content() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $3"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $3"
    ((FAILED++))
  fi
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  ((WARNINGS++))
}

echo "📁 Verificando arquivos necessários..."
check_file "public/manifest.json" "manifest.json encontrado"
check_file "src/serviceWorker.ts" "serviceWorker.ts encontrado"
check_file "src/main.tsx" "main.tsx encontrado"
check_file "src/components/PWA/PWANotification.tsx" "PWANotification.tsx encontrado"
check_file "src/components/PWA/ConnectionStatus.tsx" "ConnectionStatus.tsx encontrado"
check_file "src/utils/offlineSync.ts" "offlineSync.ts encontrado"
check_file "src/hooks/useOfflineSync.ts" "useOfflineSync.ts encontrado"
check_file "jest.config.js" "jest.config.js encontrado"
check_file "__tests__/PWA.test.tsx" "PWA.test.tsx encontrado"
check_file "__tests__/offlineSync.test.ts" "offlineSync.test.ts encontrado"

echo ""
echo "📋 Verificando configuração de arquivos..."

# Manifest.json checks
check_content "public/manifest.json" '"name"' "manifest.json tem 'name'"
check_content "public/manifest.json" '"short_name"' "manifest.json tem 'short_name'"
check_content "public/manifest.json" '"display"' "manifest.json tem 'display'"
check_content "public/manifest.json" '"icons"' "manifest.json tem 'icons'"
check_content "public/manifest.json" '"theme_color"' "manifest.json tem 'theme_color'"

# ServiceWorker checks
check_content "src/serviceWorker.ts" "CACHE_NAME" "serviceWorker.ts define CACHE_NAME"
check_content "src/serviceWorker.ts" "self.addEventListener" "serviceWorker.ts tem event listeners"
check_content "src/serviceWorker.ts" "fetch" "serviceWorker.ts trata fetch"

# Main.tsx checks
check_content "src/main.tsx" "serviceWorker" "main.tsx registra Service Worker"
check_content "src/main.tsx" "navigator.serviceWorker" "main.tsx usa Service Worker API"

# App.tsx checks
check_content "src/App.tsx" "PWAUpdateNotification" "App.tsx importa PWAUpdateNotification"
check_content "src/App.tsx" "OfflineBanner" "App.tsx importa OfflineBanner"

# Jest config checks
check_content "jest.config.js" "ts-jest" "jest.config.js usa ts-jest"
check_content "jest.config.js" "jsdom" "jest.config.js usa jsdom"

echo ""
echo "🧪 Verificando testes..."
if [ -f "__tests__/PWA.test.tsx" ]; then
  TESTS=$(grep -c "it(" "__tests__/PWA.test.tsx" || echo "0")
  echo -e "${GREEN}✓${NC} $TESTS testes encontrados em PWA.test.tsx"
  ((PASSED++))
fi

if [ -f "__tests__/offlineSync.test.ts" ]; then
  TESTS=$(grep -c "it(" "__tests__/offlineSync.test.ts" || echo "0")
  echo -e "${GREEN}✓${NC} $TESTS testes encontrados em offlineSync.test.ts"
  ((PASSED++))
fi

echo ""
echo "📦 Verificando dependências..."

# Check if npm is available
if command -v npm &> /dev/null; then
  if npm list jest > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} jest instalado"
    ((PASSED++))
  else
    warn "jest não instalado"
  fi
  
  if npm list @testing-library/react > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} @testing-library/react instalado"
    ((PASSED++))
  else
    warn "@testing-library/react não instalado"
  fi
else
  warn "npm não encontrado"
fi

echo ""
echo "📊 Resumo:"
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ Todos os checks passaram!${NC}"
  if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS avisos${NC}"
  fi
else
  echo -e "${RED}✗ $FAILED checks falharam${NC}"
fi
echo -e "  ${GREEN}Passed: $PASSED${NC}"
echo -e "  ${RED}Failed: $FAILED${NC}"
echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"

echo ""
echo "📝 Próximos passos:"
echo "1. npm install     # Install dependencies"
echo "2. npm run dev     # Start dev server"
echo "3. npm test        # Run tests"
echo "4. npm run build   # Build for production"
echo ""

if [ $FAILED -gt 0 ]; then
  exit 1
else
  exit 0
fi
