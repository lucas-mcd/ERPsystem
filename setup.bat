@echo off
REM ========================================
REM ERP SYSTEM - SETUP + RUN COMPLETO
REM Detecta automáticamente: Setup vs Dev
REM ========================================
setlocal enabledelayedexpansion
color 0A
title ERP System - Setup Completo v1.0

cd /d "%~dp0"

REM ========================================
REM VERIFICAR SE JÁ ESTÁ INSTALADO
REM ========================================
if exist backend\venv\Scripts\python.exe (
    if exist frontend\node_modules (
        goto :RUN_DEV
    )
)

REM ========================================
REM SETUP - PRIMEIRA VEZ
REM ========================================
:SETUP
cls
echo.
echo    ========================================
echo    ERP SYSTEM - SETUP INICIAL v1.0
echo    ========================================
echo.
echo    Este script vai instalar tudo sozinho
echo    NAO FECHE A JANELA - deixe rodar!
echo.
echo    Tempo estimado: 10-15 minutos
echo.
echo    ========================================
echo.

REM Sincronizar com git se possível
if exist ".git" (
    echo [SYNC] Sincronizando com repositorio...
    git pull origin main >nul 2>&1
)

REM ========================================
REM 1. VERIFICAR PYTHON
REM ========================================
echo [1/10] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo [ERRO] Python nao instalado!
        echo Visite: https://python.org
        echo Baixe Python 3.11+
        echo MARQUE: "Add python.exe to PATH"
        echo.
        pause
        exit /b 1
    )
)
echo [OK] Python encontrado

REM ========================================
REM 2. VERIFICAR NODE.JS
REM ========================================
echo [2/10] Verificando Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERRO] Node.js nao instalado!
    echo Visite: https://nodejs.org
    echo Baixe Node.js LTS
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado

REM ========================================
REM 3. VERIFICAR GIT
REM ========================================
echo [3/10] Verificando Git...
where git >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Git nao encontrado (opcional)
)

REM ========================================
REM 4. SETUP BACKEND
REM ========================================
echo [4/10] Preparando Backend...
cd /d "%~dp0backend"

if not exist venv (
    echo   - Criando virtual environment...
    python -m venv venv
)

echo   - Ativando virtual environment...
call venv\Scripts\activate.bat

echo   - Instalando dependencias...
python -m pip install -q --upgrade pip setuptools wheel 2>nul
python -m pip install -q -r requirements.txt 2>nul
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias Python
    pause
    exit /b 1
)

echo   - Preparando banco de dados...
if not exist .env (
    echo DATABASE_URL=sqlite:///./erp_system.db > .env
)
if exist erp_system.db (
    del erp_system.db
)

echo   - Inicializando banco...
if exist alembic.ini (
    alembic upgrade head >nul 2>&1
)
if exist init_db.py (
    python init_db.py >nul 2>&1
)

call deactivate

echo [OK] Backend pronto

REM ========================================
REM 5. SETUP FRONTEND
REM ========================================
cd /d "%~dp0"
echo [5/10] Preparando Frontend...
cd /d "%~dp0frontend"

if not exist .env (
    echo VITE_API_URL=http://localhost:8000 > .env
)

echo   - Limpando cache npm...
call npm cache clean --force 2>nul

echo   - Instalando dependencias...
call npm install --legacy-peer-deps 2>nul
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias npm
    pause
    exit /b 1
)

echo [OK] Frontend pronto

REM ========================================
REM SETUP CONCLUÍDO - INICIAR MODO DEV
REM ========================================
cd /d "%~dp0"
echo.
echo ========================================
echo [OK] SETUP CONCLUIDO COM SUCESSO!
echo ========================================
echo.
timeout /t 2 /nobreak

REM ========================================
REM RUN DEV - INICIAR SERVIÇOS
REM ========================================
:RUN_DEV
cls
echo.
echo ========================================
echo    ERP SYSTEM - DEV SERVER v1.0
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Docs:     http://localhost:8000/docs
echo.
echo Credenciais: admin@example.com / AdminPass123
echo.
echo Todos os servidores em 2 terminais novos...
echo.
echo ========================================
echo.

REM Matar servidores antigos se rodando
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak

REM ========================================
REM INICIAR BACKEND EM NOVA JANELA
REM ========================================
echo [1/2] Iniciando Backend (port 8000)...
start "ERP Backend" cmd /k ^
    cd /d "%~dp0backend" ^& ^
    call venv\Scripts\activate.bat ^& ^
    echo. ^& ^
    echo ========================================= ^& ^
    echo Backend ERP System Rodando ^& ^
    echo ========================================= ^& ^
    echo. ^& ^
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level info

timeout /t 3 /nobreak

REM ========================================
REM INICIAR FRONTEND EM NOVA JANELA
REM ========================================
echo [2/2] Iniciando Frontend (port 5173)...
start "ERP Frontend" cmd /k ^
    cd /d "%~dp0frontend" ^& ^
    echo. ^& ^
    echo ========================================= ^& ^
    echo Frontend ERP System Rodando ^& ^
    echo ========================================= ^& ^
    echo. ^& ^
    npm run dev

REM ========================================
REM AGUARDAR NO TERMINAL PRINCIPAL
REM ========================================
echo.
echo ========================================
echo [OK] Servidores iniciados em 2 janelas!
echo ========================================
echo.
echo Abra no navegador:
echo   http://localhost:5173
echo.
echo Feche as 2 janelas dos servidores para parar.
echo.
echo Este terminal pode ser fechado agora.
echo.
pause
