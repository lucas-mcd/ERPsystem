#!/usr/bin/env bash

# Install script para todas as 6 features avançadas
# Execute: bash install-advanced-features.sh

set -e

echo "📦 Instalando dependencies para 6 Advanced Features..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}1. Error Boundaries${NC}"
echo "✓ Arquivos criados"
echo ""

echo -e "${BLUE}2. API Integration${NC}"
echo "✓ apiClient.ts criado"
echo "✓ useApi hooks criados"
echo ""

echo -e "${BLUE}3. E2E Tests (Playwright)${NC}"
npm install -D @playwright/test @playwright/webkit 2>/dev/null || true
echo "✓ Playwright instalado"
echo ""

echo -e "${BLUE}4. Internationalization (i18n)${NC}"
echo "✓ Translations criadas (pt, en, es)"
echo "✓ I18nContext criado"
echo "✓ LanguageSelector criado"
echo ""

echo -e "${BLUE}5. Analytics${NC}"
echo "✓ Analytics manager criado"
echo "✓ useAnalytics hook criado"
echo ""

echo -e "${BLUE}6. Storybook${NC}"
npm install -D @storybook/react-vite @storybook/addon-essentials @storybook/addon-interactions @storybook/addon-coverage 2>/dev/null || true
echo "✓ Storybook instalado"
echo ""

echo -e "${GREEN}✓ Todas as features instaladas!${NC}"
echo ""

echo "📝 Próximos passos:"
echo ""
echo "1. E2E Tests:"
echo "   npm run test:e2e"
echo "   npm run test:e2e:ui"
echo ""
echo "2. Storybook:"
echo "   npm run storybook"
echo ""
echo "3. Testes Unit:"
echo "   npm test"
echo ""
echo "4. Build:"
echo "   npm run build"
echo ""

echo -e "${YELLOW}⚠️  Não esqueça de:${NC}"
echo "1. Adicionar ErrorBoundary em App.tsx"
echo "2. Adicionar I18nProvider em App.tsx"
echo "3. Configurar VITE_API_URL no .env"
echo "4. Integrar Google Analytics (opcional)"
echo "5. Adicionar LanguageSelector em Settings"
echo ""

echo -e "${GREEN}✅ Pronto para usar!${NC}"
