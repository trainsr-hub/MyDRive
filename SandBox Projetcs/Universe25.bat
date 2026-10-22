:: D:\My Drive\SandBox Projetcs\Universe25.bat
@echo off
setlocal EnableDelayedExpansion

echo ==========================================
echo   Faust Project Launcher (Background)
echo ==========================================

REM --- Resolve root as the folder containing this .bat file (always correct, even from Explorer) ---
set "ROOT=%~dp0"

REM --- Strip trailing backslash for clean path construction ---
if "!ROOT:~-1!" == "\" set "ROOT=!ROOT:~0,-1!"

set "PID_DIR=%TEMP%\FaustUniverse25"
set "BACKEND_DIR=!ROOT!\backend"
set "FRONTEND_DIR=!ROOT!\universe-25"

REM ==============================================================================
REM [MODIFIED SECTION: EXECUTABLE PATH CONFIGURATION]
REM ==============================================================================
REM Neu he thong da nhan dien duoc python va node trong PATH, de nguyen "python" va "node".
REM Neu ban muon tro thang toi file cai dat co dinh, chi can thay the tai 2 bien nay:
set "PYTHON_EXE=python"
set "NODE_EXE=node"
REM ==============================================================================
REM <!-- COMMENT BLOCK: EXECUTABLE PATH CONFIGURATION -->
REM Bien PYTHON_EXE va NODE_EXE duoc tap trung quan ly tai day va truyen truc tiep
REM xuong cac lenh chay ngam ben duoi, tranh tinh trang hardcode roi rac.
REM ==============================================================================

if not exist "%PID_DIR%" mkdir "%PID_DIR%"

REM ==========================================================
REM 1. Terminate previous Backend process tree
REM ==========================================================
if exist "%PID_DIR%\backend.pid" (
    for /f "usebackq delims=" %%i in ("%PID_DIR%\backend.pid") do taskkill /PID %%i /T /F >nul 2>&1
    del "%PID_DIR%\backend.pid" >nul 2>&1
)
taskkill /FI "WINDOWTITLE eq FAUST Backend*" /T /F >nul 2>&1

REM ==========================================================
REM 2. Terminate previous Frontend process tree
REM ==========================================================
if exist "%PID_DIR%\frontend.pid" (
    for /f "usebackq delims=" %%i in ("%PID_DIR%\frontend.pid") do taskkill /PID %%i /T /F >nul 2>&1
    del "%PID_DIR%\frontend.pid" >nul 2>&1
)
taskkill /FI "WINDOWTITLE eq FAUST Universe-25*" /T /F >nul 2>&1

REM ==========================================================
REM 3. Port Clear Sweep (8080 & 5173)
REM ==========================================================
powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 8080, 5173 } | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

ping 127.0.0.1 -n 2 >nul

REM ==============================================================================
REM [MODIFIED SECTION: LAUNCH BACKEND (HEADLESS BACKGROUND)]
REM ==============================================================================
powershell -NoProfile -Command "$p = Start-Process -FilePath '%PYTHON_EXE%' -WorkingDirectory '!BACKEND_DIR!' -ArgumentList 'run_backend.py' -WindowStyle Hidden -PassThru -RedirectStandardOutput '%PID_DIR%\backend.log' -RedirectStandardError '%PID_DIR%\backend_err.log'; if ($p) { [System.IO.File]::WriteAllText('%PID_DIR%\backend.pid', $p.Id.ToString()) }"
REM ==============================================================================
REM <!-- COMMENT BLOCK: BACKEND LAUNCH FIX -->
REM 1. Loai bo toan bo dau mu (^) noi dong va xoa sach cac bien trung gian ($workDir, $pythonExe...).
REM 2. Xoa so triet de loi dinh chuoi 'WorkingDirectory$workDir' do loi ky tu Non-Breaking Space (\u00A0).
REM 3. Truyen thang '%PYTHON_EXE%' va '!BACKEND_DIR!' vao nhay don de an toan tuyet doi
REM    voi moi duong dan chua khoang trang nhu "D:\My Drive\SandBox Projetcs".
REM ==============================================================================

REM ==============================================================================
REM [MODIFIED SECTION: LAUNCH FRONTEND (HEADLESS BACKGROUND)]
REM ==============================================================================
powershell -NoProfile -Command "$p = Start-Process -FilePath 'cmd.exe' -WorkingDirectory '!FRONTEND_DIR!' -ArgumentList '/c npx vite --host 0.0.0.0 --port 5173' -WindowStyle Hidden -PassThru -RedirectStandardOutput '%PID_DIR%\frontend.log' -RedirectStandardError '%PID_DIR%\frontend_err.log'; if ($p) { [System.IO.File]::WriteAllText('%PID_DIR%\frontend.pid', $p.Id.ToString()) }"
REM ==============================================================================
REM <!-- COMMENT BLOCK: FRONTEND LAUNCH FIX -->
REM 1. Chuyen toan bo khoi chay sang Single-line PowerShell command.
REM 2. Khoi chay Vite thong qua 'cmd.exe /c npx vite' vua giai quyet triet de viec tim kiem
REM    file npx.cmd tren Windows, vua cham dut loi vo ngoac kep khi truyen ArgumentList.
REM ==============================================================================

echo.
echo Initializing headless services (waiting for port binding)...
ping 127.0.0.1 -n 3 >nul

echo ==========================================
echo   Status: Active Headless Services
echo ==========================================
echo Backend  : http://localhost:8080  (Log: %PID_DIR%\backend.log)
echo Frontend : http://localhost:5173  (Log: %PID_DIR%\frontend.log)
echo ==========================================