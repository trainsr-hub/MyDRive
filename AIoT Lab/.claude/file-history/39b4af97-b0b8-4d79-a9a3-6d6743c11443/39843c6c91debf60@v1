@echo off
title Entropy Rose - Quote Note System
cd /d "%~dp0"

echo ========================================================
echo   Entropy Rose - Quote Note System [O(1) JSON Engine]
echo ========================================================
echo.
echo [1] Launch directly in browser via file:/// (Zero dependencies)
echo [2] Launch local web server (Python http.server on port 20135)
echo [3] Re-seed quotes database (seed_quote.py)
echo.
set /p CHOICE="Select mode [1/2/3, default 1]: "

if "%CHOICE%"=="2" goto SERVER
if "%CHOICE%"=="3" goto RESEED
goto DIRECT

:DIRECT
echo Launching index.html directly...
start "" "%~dp0index.html"
exit /b 0

:SERVER
echo Starting local web server on http://localhost:20135 ...
start "" "http://localhost:20135"
python -m http.server 20135
exit /b 0

:RESEED
echo Running seed_quote.py ...
python seed_quote.py
pause
exit /b 0
