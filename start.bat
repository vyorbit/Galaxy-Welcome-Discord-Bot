@echo off
title WelcomePro Bot
echo =======================================
echo     Starting WelcomePro Enterprise     
echo =======================================

echo [1/3] Compiling TypeScript...
call npm run build

echo [2/3] Checking for errors...
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed.
    pause
    exit
)

echo [3/3] Launching Bot Clusters...
call npm run start

pause
