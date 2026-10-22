:: D:\My Drive\SandBox Projetcs\ZZ - Shortcuts\OmniRoute.bat
@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo   OmniRoute Daemon Launcher (Background)
echo ==========================================

set "PID_DIR=%TEMP%\OmniRoute"
set "OMNI_CMD=%APPDATA%\npm\omniroute.cmd"

if not exist "%PID_DIR%" mkdir "%PID_DIR%"

if not exist "!OMNI_CMD!" (
    echo [ERROR] Khong tim thay: !OMNI_CMD!
    exit /b 1
)

REM ==========================================================
REM 1. Terminate previous OmniRoute process tree
REM ==========================================================
if exist "%PID_DIR%\omniroute.pid" (
    for /f "usebackq delims=" %%i in ("%PID_DIR%\omniroute.pid") do taskkill /PID %%i /T /F >nul 2>&1
    del "%PID_DIR%\omniroute.pid" >nul 2>&1
)

REM ==========================================================
REM Port Clear Sweep (20128)
REM ==========================================================
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq 20128 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

ping 127.0.0.1 -n 2 >nul

REM ==========================================================
REM 2. Launch OmniRoute (HEADLESS BACKGROUND)
REM    Tuong duong: cmd.exe /c "%APPDATA%\npm\omniroute.cmd"
REM ==========================================================
powershell -NoProfile -Command "$p = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c ""!OMNI_CMD!""' -WindowStyle Hidden -PassThru -RedirectStandardOutput '%PID_DIR%\omniroute.log' -RedirectStandardError '%PID_DIR%\omniroute_err.log'; if ($p) { [System.IO.File]::WriteAllText('%PID_DIR%\omniroute.pid', $p.Id.ToString()) }"

echo.
echo Initializing headless service...
ping 127.0.0.1 -n 3 >nul

echo ==========================================
echo   Status: Active Headless Service
echo ==========================================
echo OmniRoute : http://localhost:20128  (Log: %PID_DIR%\omniroute.log)
echo ==========================================
