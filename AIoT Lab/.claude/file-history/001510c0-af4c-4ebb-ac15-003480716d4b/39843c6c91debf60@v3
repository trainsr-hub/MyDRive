@echo off
title Prescripts / Entropy Rose — CQRS Quote Engine
cd /d "%~dp0"

echo ========================================================
echo   Prescripts / Entropy Rose [SQLite + O(1) Projections]
echo ========================================================
echo.
echo [1] Launch Prescripts Server & Open UI (Default)
echo [2] Launch Development Server (Hot-Reload)
echo [3] Re-seed quotes database (seed_quote.py)
echo [4] Re-compile projections (compile_projections.py)
echo [5] Push to Turso Cloud (turso_sync.py)
echo.
set /p CHOICE="Select mode [1/2/3/4/5, default 1]: "

if "%CHOICE%"=="2" goto DEV
if "%CHOICE%"=="3" goto RESEED
if "%CHOICE%"=="4" goto COMPILE
if "%CHOICE%"=="5" goto TURSO
goto LAUNCH

:TURSO
echo Running turso_sync.py ...
python turso_sync.py
pause
exit /b 0

:DEV
echo Starting Development Server with Hot-Reload...
start cmd /k "dev_server.bat"
exit /b 0

:LAUNCH
echo Starting Prescripts Server on http://localhost:20137 ...
start "" "http://localhost:20137/prescripts_entry.html"
python server.py
exit /b 0

:RESEED
echo Running seed_quote.py ...
python seed_quote.py
pause
exit /b 0

:COMPILE
echo Running compile_projections.py ...
python compile_projections.py
pause
exit /b 0
