@echo off
title Faust Sovereign Remote Daemon - Terminator
echo ========================================================
echo   Terminating Faust Sovereign Remote Daemon (Local Disk D:)
echo ========================================================
echo.

set "PYTHON_EXE=D:\Program Files\Python\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" "D:\My Drive\Blue AI\.agents\scripts\daemon\faust_remote.py" stop

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] An error occurred during termination.
    pause
) else (
    echo.
    timeout /t 3
)
