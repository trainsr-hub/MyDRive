@echo off
title Faust Sovereign C2 Bridge - Terminator
echo ========================================================
echo   Terminating Faust Sovereign C2 Bridge (Local Disk D:)
echo ========================================================
echo.

set "PYTHON_EXE=D:\Program Files\Python\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" "D:\My Drive\SandBox Projetcs\.agents\scripts\bridge_supervisor.py" stop

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] An error occurred during termination.
    pause
) else (
    echo.
    timeout /t 3
)
