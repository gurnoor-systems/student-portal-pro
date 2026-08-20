@echo off
title Student Portal Pro Launcher
echo ===================================================
echo   STUDENT PORTAL PRO - LAUNCHER
echo ===================================================
echo.
echo Freeing port 3000 if occupied...
powershell -Command "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"

echo.
echo Starting Student Portal Pro on http://localhost:3000...
start http://localhost:3000
npm run dev
pause
