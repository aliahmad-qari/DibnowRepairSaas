@echo off
echo ========================================
echo   RESTARTING DIBNOW BACKEND SERVER
echo ========================================
echo.

cd /d D:\DibnowAi\backend

echo Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting backend server...
echo.

start cmd /k "npm start"

echo.
echo ========================================
echo   Backend server is starting...
echo   Check the new window for status
echo ========================================
echo.
pause
