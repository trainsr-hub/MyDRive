@echo off
title Stop PK Network
echo Stopping PK Network servers (ports 20150 and 8787)...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":20150" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8787" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo PK Network servers stopped cleanly.
timeout /t 2 >nul
