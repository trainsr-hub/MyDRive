@echo off
title Prescripts / Entropy Rose — Development Server (Hot-Reload)
cd /d "%~dp0"

echo ========================================================
echo   Prescripts Studio — DEVELOPMENT MODE
echo   (Hot-Reload: changes auto-restart the server)
echo ========================================================
echo.

REM Check if watchdog is installed
python -c "from watchdog.observers import Observer" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INSTALL] Installing watchdog library...
    pip install watchdog
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install watchdog. Please run manually:
        echo   pip install watchdog
        pause
        exit /b 1
    )
)

echo [1] Starting development server with hot-reload...
echo [2] Server will auto-restart on code changes
echo [3] Press Ctrl+C to stop
echo.
python dev_server.py