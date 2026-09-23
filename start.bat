@echo off
title Extra LLM X - 100%% Free AI Provider Gateway
color 0B
cls
echo ==============================================================
echo    EXTRA LLM X - 100%% FREE AI GATEWAY FOR UNIVERSAL AGENT
echo ==============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js v18+ from https://nodejs.org
    pause
    exit /b 1
)

if not exist node_modules (
    echo [SETUP] Installing dependencies...
    call npm install
)

echo [SERVER] Starting Extra LLM X on http://localhost:3000 ...
echo [DOCS] Base URL for Universal Agent: http://localhost:3000/v1
echo.

start http://localhost:3000
call npm start
pause
