@echo off
chcp 65001 >nul
echo ========================================
echo       AI Blog Platform - Stop Services
echo ========================================
echo.
echo Stopping services...
docker-compose down
echo.
echo ✅ Services stopped successfully
pause
