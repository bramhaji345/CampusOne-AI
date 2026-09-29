@echo off
setlocal
cd /d "%~dp0"

echo Starting CampusOne local database, API, and website...
start "CampusOne Backend" cmd /k "cd /d "%~dp0backend" && npm run db:local && npm run dev"

start "CampusOne Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo CampusOne is starting.
echo Website: http://localhost:5173/login
echo.
pause
