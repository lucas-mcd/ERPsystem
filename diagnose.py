#!/usr/bin/env python3
"""
Script de Diagnóstico - ERP System
Ajuda a identificar problemas com o setup e serviços
"""

import os
import sys
import subprocess
import socket
import requests
from pathlib import Path
from datetime import datetime

class Colors:
    OK = '\033[92m'
    ERROR = '\033[91m'
    WARNING = '\033[93m'
    INFO = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_ok(msg):
    print(f"{Colors.OK}[OK]{Colors.RESET} {msg}")

def print_error(msg):
    print(f"{Colors.ERROR}[ERROR]{Colors.RESET} {msg}")

def print_warning(msg):
    print(f"{Colors.WARNING}[WARNING]{Colors.RESET} {msg}")

def print_info(msg):
    print(f"{Colors.INFO}[INFO]{Colors.RESET} {msg}")

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.INFO}{'='*50}{Colors.RESET}")
    print(f"{Colors.BOLD}{msg}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.INFO}{'='*50}{Colors.RESET}\n")

def check_python():
    """Verificar Python"""
    print_header("VERIFICACAO PYTHON")
    try:
        version = sys.version
        print_ok(f"Python {version}")
        return True
    except Exception as e:
        print_error(f"Erro ao verificar Python: {e}")
        return False

def check_directories():
    """Verificar estrutura de diretórios"""
    print_header("VERIFICACAO DIRETORIOS")
    required_dirs = {
        'backend': ['app', 'migrations', 'venv'],
        'frontend': ['src', 'public', 'node_modules'],
    }
    
    all_ok = True
    for parent_dir, subdirs in required_dirs.items():
        parent_path = Path(parent_dir)
        if not parent_path.exists():
            print_error(f"Diretorio nao encontrado: {parent_dir}")
            all_ok = False
            continue
        
        for subdir in subdirs:
            subpath = parent_path / subdir
            if subpath.exists():
                print_ok(f"{parent_dir}/{subdir}")
            else:
                if subdir == 'venv':
                    print_warning(f"{parent_dir}/{subdir} - nao encontrado (pode precisar de reinstalacao)")
                elif subdir == 'node_modules':
                    print_warning(f"{parent_dir}/{subdir} - nao encontrado (pode precisar de npm install)")
                else:
                    print_error(f"{parent_dir}/{subdir} - nao encontrado!")
                    all_ok = False
    
    return all_ok

def check_backend_files():
    """Verificar arquivos críticos do backend"""
    print_header("VERIFICACAO ARQUIVOS BACKEND")
    backend_path = Path('backend')
    required_files = [
        'init_db.py',
        'pyproject.toml',
        'requirements.txt',
        'alembic.ini',
        'app/main.py',
        'app/core/database.py',
    ]
    
    all_ok = True
    for file in required_files:
        filepath = backend_path / file
        if filepath.exists():
            print_ok(f"backend/{file}")
        else:
            print_error(f"backend/{file} - AUSENTE!")
            all_ok = False
    
    return all_ok

def check_frontend_files():
    """Verificar arquivos críticos do frontend"""
    print_header("VERIFICACAO ARQUIVOS FRONTEND")
    frontend_path = Path('frontend')
    required_files = [
        'package.json',
        'vite.config.ts',
        'index.html',
        'src/App.tsx',
        'src/main.tsx',
    ]
    
    all_ok = True
    for file in required_files:
        filepath = frontend_path / file
        if filepath.exists():
            print_ok(f"frontend/{file}")
        else:
            print_error(f"frontend/{file} - AUSENTE!")
            all_ok = False
    
    return all_ok

def check_port_available(port):
    """Verificar se uma porta está disponível"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result != 0

def check_backend_connection(port=8000):
    """Verificar conexão com backend"""
    print_header("VERIFICACAO CONEXAO BACKEND")
    print_info(f"Testando porta {port}...")
    
    try:
        response = requests.get(f'http://localhost:{port}/health', timeout=2)
        if response.status_code == 200:
            print_ok(f"Backend respondendo em http://localhost:{port}")
            print_ok(f"Health check: {response.json()}")
            return True
        else:
            print_error(f"Backend respondeu com status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Nao foi possivel conectar em http://localhost:{port}")
        print_warning("Backend pode nao estar rodando")
        
        # Verificar se processo está rodando
        try:
            result = subprocess.run(['pgrep', '-f', 'uvicorn app.main'], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                print_warning(f"Processo uvicorn detectado (PID: {result.stdout.strip()})")
                print_info("Backend pode estar inicializando, aguarde alguns segundos")
                return None  # Unknown state
            else:
                print_error("Nenhum processo uvicorn em execucao")
        except:
            pass
        
        return False
    except Exception as e:
        print_error(f"Erro ao testar backend: {e}")
        return False

def check_frontend_connection(port=5173):
    """Verificar conexão com frontend"""
    print_header("VERIFICACAO CONEXAO FRONTEND")
    print_info(f"Testando porta {port}...")
    
    try:
        response = requests.get(f'http://localhost:{port}', timeout=2)
        if response.status_code == 200:
            print_ok(f"Frontend respondendo em http://localhost:{port}")
            return True
        else:
            print_warning(f"Frontend respondeu com status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error(f"Nao foi possivel conectar em http://localhost:{port}")
        
        # Verificar se processo está rodando
        try:
            result = subprocess.run(['pgrep', '-f', 'npm run dev'], 
                                  capture_output=True, text=True)
            if result.stdout.strip():
                print_warning(f"Processo npm detectado")
                print_info("Frontend pode estar inicializando")
                return None
            else:
                print_error("Nenhum processo npm em execucao")
        except:
            pass
        
        return False
    except Exception as e:
        print_error(f"Erro ao testar frontend: {e}")
        return False

def check_database():
    """Verificar banco de dados"""
    print_header("VERIFICACAO BANCO DE DADOS")
    db_path = Path('backend/erp_system.db')
    
    if db_path.exists():
        size = db_path.stat().st_size
        size_mb = size / (1024 * 1024)
        print_ok(f"Banco de dados encontrado: {size_mb:.2f} MB")
        return True
    else:
        print_warning("Banco de dados nao encontrado (sera criado ao iniciar)")
        return None

def check_logs():
    """Verificar logs de erro"""
    print_header("VERIFICACAO LOGS")
    
    backend_log = Path('backend/backend.log')
    if backend_log.exists():
        print_info("Ultimas linhas de backend.log:")
        with open(backend_log, 'r') as f:
            lines = f.readlines()[-10:]
            for line in lines:
                # Check for errors
                if 'error' in line.lower() or 'exception' in line.lower():
                    print_error(f"  {line.rstrip()}")
                elif 'warning' in line.lower():
                    print_warning(f"  {line.rstrip()}")
                else:
                    print(f"  {line.rstrip()}")
    
    setup_logs = list(Path('.').glob('setup_*.log'))
    if setup_logs:
        latest_log = max(setup_logs, key=lambda p: p.stat().st_ctime)
        print_info(f"Log de setup mais recente: {latest_log.name}")
        
        with open(latest_log, 'r') as f:
            content = f.read()
            if '[ERROR]' in content:
                print_warning("Erros encontrados no log de setup:")
                for line in content.split('\n'):
                    if '[ERROR]' in line:
                        print_error(f"  {line}")

def main():
    """Executar diagnóstico completo"""
    print(f"\n{Colors.BOLD}ERP SYSTEM - SCRIPT DE DIAGNOSTICO{Colors.RESET}")
    print(f"Executado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
    
    results = {
        'Python': check_python(),
        'Diretorios': check_directories(),
        'Arquivos Backend': check_backend_files(),
        'Arquivos Frontend': check_frontend_files(),
        'Banco de Dados': check_database(),
        'Backend': check_backend_connection(),
        'Frontend': check_frontend_connection(),
    }
    
    check_logs()
    
    # Resumo
    print_header("RESUMO DIAGNOSTICO")
    
    for check_name, result in results.items():
        if result is True:
            print_ok(f"{check_name}: OK")
        elif result is False:
            print_error(f"{check_name}: PROBLEMA DETECTADO")
        else:
            print_warning(f"{check_name}: STATUS DESCONHECIDO")
    
    # Recomendacoes
    print_header("RECOMENDACOES")
    
    if results['Backend'] is False:
        print_warning("Backend nao respondendo:")
        print_info("  1. Verifique backend.log para erros")
        print_info("  2. Tente: ./setup-linux.sh restart")
        print_info("  3. Se usar tmux: tmux attach -t erp:backend")
    
    if results['Database'] is None:
        print_info("Banco nao foi criado, sera feito na proxima iniciacializacao")
    
    print_info("\nMais informacoes: ./setup-linux.sh check")
    print_info("Para resetar tudo: cd backend && python reset_db.py")
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Diagnostico interrompido{Colors.RESET}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.ERROR}Erro durante diagnostico: {e}{Colors.RESET}")
        sys.exit(1)
