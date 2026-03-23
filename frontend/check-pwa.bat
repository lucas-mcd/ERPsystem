@echo off
REM PWA Health Check Script for Windows
REM Verifica se todos os componentes PWA estão configurados corretamente

setlocal enabledelayedexpansion

echo 0x1B[38;5;33m
echo Verificando configuracao PWA...
echo 0x1B[0m
echo.

set PASSED=0
set FAILED=0
set WARNINGS=0

REM Function to check file
:check_file
if exist "%~1" (
    echo [OK] %2
    set /a PASSED+=1
) else (
    echo [FAIL] %2 (missing: %1^)
    set /a FAILED+=1
)
exit /b

REM Check files
echo Verificando arquivos necessarios...
if exist "public\manifest.json" (
    echo [OK] manifest.json encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] manifest.json nao encontrado
    set /a FAILED+=1
)

if exist "src\serviceWorker.ts" (
    echo [OK] serviceWorker.ts encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] serviceWorker.ts nao encontrado
    set /a FAILED+=1
)

if exist "src\main.tsx" (
    echo [OK] main.tsx encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] main.tsx nao encontrado
    set /a FAILED+=1
)

if exist "src\components\PWA\PWANotification.tsx" (
    echo [OK] PWANotification.tsx encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] PWANotification.tsx nao encontrado
    set /a FAILED+=1
)

if exist "src\components\PWA\ConnectionStatus.tsx" (
    echo [OK] ConnectionStatus.tsx encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] ConnectionStatus.tsx nao encontrado
    set /a FAILED+=1
)

if exist "src\utils\offlineSync.ts" (
    echo [OK] offlineSync.ts encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] offlineSync.ts nao encontrado
    set /a FAILED+=1
)

if exist "src\hooks\useOfflineSync.ts" (
    echo [OK] useOfflineSync.ts encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] useOfflineSync.ts nao encontrado
    set /a FAILED+=1
)

if exist "jest.config.js" (
    echo [OK] jest.config.js encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] jest.config.js nao encontrado
    set /a FAILED+=1
)

if exist "__tests__\PWA.test.tsx" (
    echo [OK] PWA.test.tsx encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] PWA.test.tsx nao encontrado
    set /a FAILED+=1
)

if exist "__tests__\offlineSync.test.ts" (
    echo [OK] offlineSync.test.ts encontrado
    set /a PASSED+=1
) else (
    echo [FAIL] offlineSync.test.ts nao encontrado
    set /a FAILED+=1
)

echo.
echo Verificando App.tsx...

findstr /m "PWAUpdateNotification" src\App.tsx >nul
if !errorlevel! equ 0 (
    echo [OK] App.tsx importa PWAUpdateNotification
    set /a PASSED+=1
) else (
    echo [FAIL] App.tsx nao importa PWAUpdateNotification
    set /a FAILED+=1
)

findstr /m "OfflineBanner" src\App.tsx >nul
if !errorlevel! equ 0 (
    echo [OK] App.tsx importa OfflineBanner
    set /a PASSED+=1
) else (
    echo [FAIL] App.tsx nao importa OfflineBanner
    set /a FAILED+=1
)

echo.
echo Resumo:
echo.
if %FAILED% equ 0 (
    echo [SUCCESS] Todos os checks passaram!
) else (
    echo [FAILED] %FAILED% checks falharam
)
echo Passed: %PASSED%
echo Failed: %FAILED%
echo Warnings: %WARNINGS%

echo.
echo Proximos passos:
echo 1. npm install     # Install dependencies
echo 2. npm run dev     # Start dev server
echo 3. npm test        # Run tests
echo 4. npm run build   # Build for production
echo.

if %FAILED% gtr 0 (
    exit /b 1
) else (
    exit /b 0
)
