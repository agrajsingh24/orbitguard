@echo off
setlocal enabledelayedexpansion
title OrbitGuard Server

:: Change directory to where this batch file is located
cd /d "%~dp0"

echo ===================================================
echo   OrbitGuard - Laboratory Experiment Monitor
echo ===================================================
echo Current directory: %CD%

:: Check for Python
set "PY_CMD="
where python >nul 2>&1 && set "PY_CMD=python"
if not defined PY_CMD (
    where py >nul 2>&1 && set "PY_CMD=py"
)
if not defined PY_CMD (
    where python3 >nul 2>&1 && set "PY_CMD=python3"
)

if not defined PY_CMD (
    echo [ERROR] Python was not found in your PATH.
    echo Please install Python from https://www.python.org/
    echo.
    echo Attempting to open index.html directly...
    echo (Note: Physical webcam requires localhost/HTTP server in modern browsers,
    echo  but Demo mode works completely offline!)
    start "" "%~dp0index.html"
    pause
    exit /b 1
)

:: Check if port 8000 is already in use and free it
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Port 8000 is occupied by process %%a. Freeing port...
    taskkill /F /PID %%a >nul 2>&1
)

:: Wait half a second for port to clear
timeout /t 1 /nobreak >nul

:: Launch browser
echo Opening browser at http://localhost:8000...
start "" http://localhost:8000

echo.
echo OrbitGuard is running on http://localhost:8000
echo Keep this window open while using OrbitGuard.
echo Press Ctrl+C to stop the server.
echo ===================================================
%PY_CMD% -m http.server 8000

if %ERRORLEVEL% neq 0 (
    echo.
    echo [WARNING] Server stopped or exited with error code %ERRORLEVEL%.
    pause
)

