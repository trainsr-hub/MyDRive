@echo off
title Faust Sovereign Remote Daemon - Status
echo ========================================================
echo   Checking Faust Sovereign Remote Daemon (Local Disk D:)
echo ========================================================
echo.

set "PYTHON_EXE=D:\Program Files\Python\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"

"%PYTHON_EXE%" "D:\My Drive\Blue AI\.agents\scripts\daemon\faust_remote.py" status

echo.
pause
