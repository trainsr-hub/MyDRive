@echo off
title Faust Sovereign C2 Bridge - Launcher
echo ========================================================
echo   Launching Faust Sovereign C2 Bridge (Local Disk D:)
echo ========================================================
echo.

set "PYTHON_EXE=D:\Program Files\Python\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" "D:\My Drive\SandBox Projetcs\.agents\scripts\bridge_supervisor.py" start

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] An error occurred during startup.
    pause
) else (
    echo.
    timeout /t 5
)
