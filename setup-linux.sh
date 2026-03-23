#!/bin/bash
# Setup Script v6.0 - Sem Duplicatas e Erros Corrigidos
set -euo pipefail
APP_VERSION="6.0"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_PORT=8000
FRONTEND_PORT=5173
LOG_FILE="${SCRIPT_DIR}/setup_$(date +%Y%m%d_%H%M%S).log"
BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
BOLD='\033[1m'

trap 'handle_error $? $LINENO' ERR
trap 'handle_interrupt' INT TERM

handle_error() {
    print_error "ERRO: Script falhou na linha $2"
    tail -30 "$LOG_FILE" 2>/dev/null || true
    exit 1
}

handle_interrupt() {
    print_warning "Interrompido"
    exit 130
}

print_header() { 
    echo -e "${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}${BOLD}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${BLUE}========================================${NC}" | tee -a "$LOG_FILE"
}

print_success() { echo -e "${GREEN}[OK] $1${NC}" | tee -a "$LOG_FILE"; }
print_error() { echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"; }
print_warning() { echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"; }
print_info() { echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"; }

run_with_retry() {
    local max="${1:-3}" wait="${2:-2}"; shift 2
    local attempt=1
    while [ $attempt -le $max ]; do
        if eval "$@" >> "$LOG_FILE" 2>&1; then return 0; fi
        [ $attempt -lt $max ] && { sleep "$wait"; wait=$((wait*2)); }
        attempt=$((attempt+1))
    done
    return 1
}

check_system() {
    print_info "[1/6] Verificando sistema..."
    if [ ! -w "$SCRIPT_DIR" ]; then
        print_error "Sem permissão de escrita no diretório"
        return 1
    fi
    if [ ! -d "$SCRIPT_DIR/backend" ]; then
        print_error "Backend não encontrado"
        return 1
    fi
    if [ ! -d "$SCRIPT_DIR/frontend" ]; then
        print_error "Frontend não encontrado"
        return 1
    fi
    print_success "Sistema validado"
    return 0
}

check_python() {
    print_info "[2/6] Verificando Python..."
    if command -v python3 &>/dev/null; then
        local v=$(python3 --version 2>&1 | awk '{print $2}')
        print_success "Python $v encontrado"
        return 0
    fi
    print_warning "Python não encontrado, tentando instalar..."
    if command -v apt-get &>/dev/null; then
        sudo apt-get update && sudo apt-get install -y python3 python3-venv git curl || return 1
        print_success "Python instalado"
    else
        print_error "Package manager apt-get não encontrado"
        return 1
    fi
    return 0
}

check_nodejs() {
    print_info "[3/6] Verificando Node.js..."
    if command -v node &>/dev/null; then
        local v=$(node --version | sed 's/v//')
        print_success "Node.js $v encontrado"
        return 0
    fi
    print_warning "Node.js não encontrado, tentando instalar..."
    if command -v apt-get &>/dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x 2>/dev/null | sudo -E bash - 2>/dev/null && sudo apt-get install -y nodejs || return 1
        print_success "Node.js instalado"
    else
        print_error "Package manager apt-get não encontrado"
        return 1
    fi
    return 0
}

setup_backend() {
    print_header "BACKEND"
    cd "$SCRIPT_DIR/backend" || return 1
    
    # Limpar venv quebrado
    [ -d "venv" ] && [ ! -f "venv/bin/python" ] && rm -rf venv
    
    # Criar venv se não existir
    [ ! -d "venv" ] && { python3 -m venv venv || return 1; }
    
    source venv/bin/activate || return 1
    
    # Atualizar pip
    pip install --upgrade pip setuptools wheel >/dev/null 2>&1 || true
    
    # Instalar dependências
    if ! pip install -r requirements.txt >> "$LOG_FILE" 2>&1; then
        print_error "Falha ao instalar dependências"
        deactivate
        return 1
    fi
    
    # Preparar arquivo .env
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            echo "DATABASE_URL=sqlite:///./erp_system.db" > .env
        fi
    fi
    
    # Limpar banco antigo
    print_info "Limpando banco de dados antigo..."
    rm -f erp_system.db >/dev/null 2>&1 || true
    rm -rf migrations/versions/* >/dev/null 2>&1 || true
    
    # Executar migrações se disponível
    if [ -f "alembic.ini" ] && [ -d "migrations" ]; then
        print_info "Executando migrações Alembic..."
        if alembic upgrade head >> "$LOG_FILE" 2>&1; then
            print_success "Migrações executadas"
        else
            print_warning "Migrações falharam (continuando com init_db.py)"
            # Tentar stamp ao invés de upgrade
            alembic stamp head >> "$LOG_FILE" 2>&1 || true
        fi
    fi
    
    # Inicializar banco com dados de teste
    if [ -f "init_db.py" ]; then
        print_info "Inicializando banco com dados de teste..."
        if python init_db.py >> "$LOG_FILE" 2>&1; then
            print_success "Banco inicializado com dados"
        else
            print_error "Falha ao inicializar banco"
            # Mostrar ultimas linhas do log
            tail -10 "$LOG_FILE" | grep -i "error" || true
            return 1
        fi
    fi
    
    # Verificar se banco foi criado
    if [ -f "erp_system.db" ]; then
        print_success "Arquivo de banco detectado"
    else
        print_warning "Arquivo de banco nao detectado (sera criado ao iniciar)"
    fi
    
    deactivate
    cd "$SCRIPT_DIR"
    print_success "Backend OK"
    return 0
}

setup_frontend() {
    print_header "FRONTEND"
    cd "$SCRIPT_DIR/frontend" || return 1
    
    # Validar package.json
    [ ! -f "package.json" ] && { print_error "package.json ausente"; return 1; }
    
    # Limpar caches antigos
    print_info "Limpando caches..."
    rm -rf node_modules dist .vite 2>/dev/null || true
    npm cache clean --force 2>/dev/null || true
    
    # Instalar dependências com retry
    print_info "Instalando dependências npm..."
    local npm_attempt=1
    while [ $npm_attempt -le 4 ]; do
        if npm install --legacy-peer-deps >> "$LOG_FILE" 2>&1; then
            print_success "Dependências npm instaladas"
            break
        fi
        if [ $npm_attempt -lt 4 ]; then
            print_warning "Tentativa $npm_attempt falhou, aguardando..."
            sleep 5
        else
            print_error "npm install falhou após 4 tentativas"
            return 1
        fi
        npm_attempt=$((npm_attempt + 1))
    done
    
    # Criar .env se não existir
    [ ! -f ".env" ] && echo "VITE_API_URL=http://localhost:8000" > .env
    
    cd "$SCRIPT_DIR"
    print_success "Frontend OK"
    return 0
}

check_services_health() {
    print_header "VERIFICACAO DE SAUDE"
    
    # Verificar backend
    print_info "Backend (porta $BACKEND_PORT)..."
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        HEALTH=$(curl -s http://localhost:$BACKEND_PORT/health)
        print_success "Backend respondendo: $HEALTH"
    else
        print_error "Backend nao esta respondendo"
        if [ -f "backend.log" ]; then
            print_warning "Ultimas linhas de backend.log:"
            tail -5 backend.log | sed 's/^/  /'
        fi
    fi
    
    # Verificar frontend
    print_info "Frontend (porta $FRONTEND_PORT)..."
    if curl -s -I http://localhost:$FRONTEND_PORT 2>/dev/null | grep -q "200"; then
        print_success "Frontend respondendo"
    else
        print_warning "Frontend pode estar inicializando"
    fi
    
    # Verificar processos
    print_info "Processos..."
    if pgrep -f "uvicorn app.main" >/dev/null; then
        print_success "Backend em execucao ($(pgrep -f 'uvicorn app.main' | wc -l) processo)"
    else
        print_error "Backend nao esta em execucao"
    fi
    
    if pgrep -f "npm run dev" >/dev/null; then
        print_success "Frontend em execucao"
    else
        print_warning "Frontend nao detectado"
    fi
    
    return 0
}

start_services() {
    print_header "INICIANDO SERVIÇOS"
    pkill -f "uvicorn app.main" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    sleep 2
    
    if command -v tmux &>/dev/null; then
        tmux kill-session -t erp 2>/dev/null || true
        sleep 1
        tmux new-session -d -s erp -n backend
        tmux send-keys -t erp:backend "cd '$SCRIPT_DIR/backend' && source venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT" Enter
        
        print_info "Backend iniciando em tmux (aguardando 5s)..."
        sleep 5
        
        # Verificar se backend está rodando
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            print_success "Backend respondendo na porta $BACKEND_PORT"
        else
            print_warning "Backend pode estar inicializando ainda, verifique com: tmux attach -t erp"
        fi
        
        tmux new-window -t erp:1 -n frontend
        tmux send-keys -t erp:frontend "cd '$SCRIPT_DIR/frontend' && npm run dev" Enter
        sleep 3
        print_success "Serviços iniciados em tmux"
        print_info "Acompanhar: tmux attach -t erp"
        print_info "Logs armazenados em: $LOG_FILE"
    else
        # Modo nohup (sem tmux)
        print_info "Iniciando backend em background..."
        cd "$SCRIPT_DIR/backend"
        source venv/bin/activate
        nohup python -m uvicorn app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT > backend.log 2>&1 &
        BACKEND_PID=$!
        deactivate || true
        
        sleep 5
        
        # Verificar se backend iniciou corretamente
        if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
            print_success "Backend respondendo na porta $BACKEND_PORT (PID: $BACKEND_PID)"
        else
            print_error "Backend falhou ao iniciar. Verifique backend.log:"
            tail -20 backend.log 2>/dev/null || true
            return 1
        fi
        
        print_info "Iniciando frontend em background..."
        cd "$SCRIPT_DIR/frontend"
        nohup npm run dev > frontend.log 2>&1 &
        FRONTEND_PID=$!
        
        sleep 3
        print_success "Frontend iniciado (PID: $FRONTEND_PID)"
        
        cd "$SCRIPT_DIR"
        print_info "Logs: backend.log, frontend.log"
    fi
    return 0
}

main() {
    clear
    print_header "ERP System Setup v${APP_VERSION}"
    print_info "Log: $LOG_FILE"
    print_info ""
    
    # Sincronizar com repositório
    if [ -d ".git" ]; then
        print_info "Sincronizando repositório..."
        git pull origin main >/dev/null 2>&1 || print_warning "Falha ao sincronizar git"
    fi
    
    # Executar verificações e setup
    check_system || exit 1
    check_python || exit 1
    check_nodejs || exit 1
    setup_backend || exit 1
    setup_frontend || exit 1
    start_services || exit 1
    
    # Resumo final
    clear
    print_header "[OK] SETUP CONCLUIDO COM SUCESSO"
    echo ""
    echo "Sistema ERP pronto para uso!"
    echo ""
    echo "URLs:"
    echo "  Frontend: http://localhost:${FRONTEND_PORT}"
    echo "  API Docs: http://localhost:${BACKEND_PORT}/docs"
    echo "  Health:   http://localhost:${BACKEND_PORT}/health"
    echo ""
    echo "Credenciais de teste:"
    echo "  Email: admin@example.com"
    echo "  Senha: AdminPass123"
    echo ""
    echo "DEBUG - Se o backend nao responder:"
    echo "  - Com tmux: tmux attach -t erp:backend"
    echo "  - Sem tmux: tail -f backend.log"
    echo "  - Log completo: $LOG_FILE"
    echo ""
    echo "Para parar os serviços:"
    echo "  - Com tmux: tmux kill-session -t erp"
    echo "  - Sem tmux: pkill -f uvicorn; pkill -f 'npm run dev'"
    echo ""
}

[[ "${BASH_SOURCE[0]}" == "${0}" ]] && {
    case "${1:-}" in
        check)
            check_services_health
            ;;
        logs)
            if [ -f "backend.log" ]; then
                echo "=== Backend Log ==="
                tail -50 backend.log
            fi
            if [ -f "frontend.log" ]; then
                echo ""
                echo "=== Frontend Log ==="
                tail -50 frontend.log
            fi
            ;;
        restart)
            print_warning "Parando servicos..."
            pkill -f "uvicorn app.main" 2>/dev/null || true
            pkill -f "npm run dev" 2>/dev/null || true
            sleep 2
            print_info "Iniciando servicos..."
            cd "$SCRIPT_DIR"
            start_services
            sleep 5
            check_services_health
            ;;
        *)
            main "$@"
            ;;
    esac
}

