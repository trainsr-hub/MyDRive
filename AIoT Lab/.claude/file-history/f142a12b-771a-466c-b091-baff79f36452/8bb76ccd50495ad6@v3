@echo off
setlocal EnableDelayedExpansion
title Faust Sovereign Remote Daemon

set "PYTHON_EXE=D:\Program Files\Python\python.exe"
if not exist "%PYTHON_EXE%" set "PYTHON_EXE=python"
set "DAEMON_SCRIPT=D:\My Drive\Blue AI\.agents\scripts\daemon\faust_remote.py"

REM Launch completely hidden in background with zero window pop-up
powershell -NoProfile -Command "Start-Process -FilePath '%PYTHON_EXE%' -ArgumentList '\"%DAEMON_SCRIPT%\" run-foreground' -WindowStyle Hidden"

exit
