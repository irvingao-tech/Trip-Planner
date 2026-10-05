@echo off
setlocal
title Japan Trip Planner - Dev Server
cd /d "%~dp0"

echo ============================================
echo   Japan Trip Planner - Local Dev Server
echo ============================================
echo.

REM ---- 1. Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found.
  echo         Please install Node.js 18 or newer: https://nodejs.org/
  echo.
  pause
  exit /b 1
)
for /f "delims=" %%v in ('node --version') do set "NODE_VERSION=%%v"
echo [OK] Node.js %NODE_VERSION%

REM ---- 2. Check dependencies ----
if not exist "node_modules\next" (
  echo [SETUP] Installing dependencies for the first time ...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed. Check your network and try again.
    pause
    exit /b 1
  )
) else (
  echo [OK] Dependencies installed
)

REM ---- 3. Prepare environment ----
if not exist ".env.local" (
  if exist ".env.example" (
    echo [SETUP] Creating .env.local from .env.example ...
    copy /y ".env.example" ".env.local" >nul
  )
) else (
  echo [OK] .env.local found
)

echo.
echo [START] Dev server: http://localhost:3000
echo         The browser will open automatically. Press Ctrl+C to stop.
echo.

REM ---- 4. Open browser after a short delay ----
start "" /min cmd /c "timeout /t 6 /nobreak >nul & start http://localhost:3000"

REM ---- 5. Start the dev server ----
call npm run dev

echo.
echo [STOP] Dev server stopped.
pause
endlocal
