.PHONY: help install-backend install-frontend install-all backend-run frontend-run run-docker test lint format clean reset-db

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
RED := \033[0;31m
NC := \033[0m # No Color

help:
	@echo "$(BLUE)=== ERP System - Available Commands ====$(NC)"
	@echo ""
	@echo "$(GREEN)Installation:$(NC)"
	@echo "  make install-backend    - Instalar dependências do backend"
	@echo "  make install-frontend   - Instalar dependências do frontend"
	@echo "  make install-all        - Instalar tudo"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make backend-run        - Rodar servidor backend (http://localhost:8000)"
	@echo "  make frontend-run       - Rodar servidor frontend (http://localhost:5173)"
	@echo "  make run                - Rodar backend + frontend (em terminals separados)"
	@echo ""
	@echo "$(GREEN)Docker:$(NC)"
	@echo "  make run-docker         - Rodar com Docker Compose (toda stack)"
	@echo "  make stop-docker        - Parar containers Docker"
	@echo ""
	@echo "$(GREEN)Database:$(NC)"
	@echo "  make init-db            - Inicializar banco com dados de teste"
	@echo "  make reset-db           - Resetar banco de dados completamente"
	@echo ""
	@echo "$(GREEN)Testing & Quality:$(NC)"
	@echo "  make test               - Rodar todos os testes"
	@echo "  make test-unit          - Rodar apenas testes unitários"
	@echo "  make test-integration   - Rodar apenas testes de integração"
	@echo "  make lint               - Verificar código (linters)"
	@echo "  make format             - Formatar código automaticamente"
	@echo ""
	@echo "$(GREEN)Utilities:$(NC)"
	@echo "  make clean              - Limpar arquivos temporários"
	@echo "  make docs               - Abrir API documentation"
	@echo ""

# ============= Installation =============

install-backend:
	@echo "$(BLUE)Instalando dependências do backend...$(NC)"
	@cd backend && python -m venv venv
	@cd backend && venv/Scripts/activate && pip install -r requirements.txt
	@echo "$(GREEN)✓ Backend instalado!$(NC)"

install-frontend:
	@echo "$(BLUE)Instalando dependências do frontend...$(NC)"
	@cd frontend && npm install
	@echo "$(GREEN)✓ Frontend instalado!$(NC)"

install-all: install-backend install-frontend
	@echo "$(GREEN)✓ Todas as dependências instaladas!$(NC)"

# ============= Development =============

backend-run:
	@echo "$(BLUE)Iniciando servidor backend...$(NC)"
	@cd backend && python -m uvicorn app.main:app --reload
	@echo "$(GREEN)Backend rodando em http://localhost:8000$(NC)"

frontend-run:
	@echo "$(BLUE)Iniciando servidor frontend...$(NC)"
	@cd frontend && npm run dev
	@echo "$(GREEN)Frontend rodando em http://localhost:5173$(NC)"

run:
	@echo "$(BLUE)Iniciando backend e frontend...$(NC)"
	@echo "$(YELLOW)Abra dois terminais e execute:$(NC)"
	@echo "  Terminal 1: make backend-run"
	@echo "  Terminal 2: make frontend-run"

# ============= Docker =============

run-docker:
	@echo "$(BLUE)Iniciando com Docker Compose...$(NC)"
	docker-compose up --build
	@echo "$(GREEN)Stack rodando:$(NC)"
	@echo "  Frontend: http://localhost:5173"
	@echo "  Backend: http://localhost:8000"

stop-docker:
	@echo "$(BLUE)Parando containers Docker...$(NC)"
	docker-compose down

# ============= Database =============

init-db:
	@echo "$(BLUE)Inicializando banco de dados com dados de teste...$(NC)"
	@cd backend && python init_db.py
	@echo "$(GREEN)✓ Banco inicializado! Credenciais de teste:$(NC)"
	@echo "  Admin: admin@example.com / AdminPass123"
	@echo "  User: user@example.com / UserPass123"
	@echo "  Viewer: viewer@example.com / ViewerPass123"

reset-db:
	@echo "$(RED)⚠ Resetting database (dados serão perdidos)...$(NC)"
	@cd backend && python -c "from app.core.database import Base, engine; Base.metadata.drop_all(engine); Base.metadata.create_all(engine); print('✓ Banco resetado!')"
	@make init-db

# ============= Testing =============

test:
	@echo "$(BLUE)Executando testes...$(NC)"
	@cd backend && python -m pytest app/tests/ -v --tb=short
	@echo "$(GREEN)✓ Testes completos!$(NC)"

test-unit:
	@echo "$(BLUE)Executando testes unitários...$(NC)"
	@cd backend && python -m pytest app/tests/unit/ -v --tb=short

test-integration:
	@echo "$(BLUE)Executando testes de integração...$(NC)"
	@cd backend && python -m pytest app/tests/integration/ -v --tb=short

test-cov:
	@echo "$(BLUE)Executando testes com cobertura...$(NC)"
	@cd backend && python -m pytest app/tests/ --cov=app --cov-report=html --cov-report=term-missing
	@echo "$(GREEN)✓ Relatório de cobertura: htmlcov/index.html$(NC)"

# ============= Code Quality =============

lint:
	@echo "$(BLUE)Verificando qualidade do código...$(NC)"
	@cd backend && python -m pylint app/ || true
	@echo "$(GREEN)✓ Lint completo!$(NC)"

format:
	@echo "$(BLUE)Formatando código...$(NC)"
	@cd backend && python -m black app/
	@cd frontend && npm run format
	@echo "$(GREEN)✓ Código formatado!$(NC)"

# ============= Utilities =============

clean:
	@echo "$(BLUE)Limpando arquivos temporários...$(NC)"
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@rm -rf backend/.pytest_cache 2>/dev/null || true
	@rm -rf backend/htmlcov 2>/dev/null || true
	@rm -rf frontend/dist 2>/dev/null || true
	@rm -rf frontend/node_modules/.vite 2>/dev/null || true
	@echo "$(GREEN)✓ Limpeza completa!$(NC)"

docs:
	@echo "$(BLUE)Abrindo documentação da API...$(NC)"
	@echo "$(GREEN)Acesse: http://localhost:8000/docs$(NC)"
	@echo "$(YELLOW)Certifique-se que o backend está rodando!$(NC)"

# ============= Info =============

info:
	@echo "$(BLUE)=== Informações do Sistema ===$(NC)"
	@echo ""
	@echo "$(GREEN)Versions:$(NC)"
	@python --version 2>/dev/null || echo "Python não encontrado"
	@node --version 2>/dev/null || echo "Node não encontrado"
	@echo ""
	@echo "$(GREEN)Status:$(NC)"
	@echo "  Backend: $(shell curl -s http://localhost:8000/health >/dev/null && echo '✓ Online' || echo '✗ Offline')"
	@echo "  Frontend: $(shell curl -s http://localhost:5173 >/dev/null && echo '✓ Online' || echo '✗ Offline')"
	@echo ""
