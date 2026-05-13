@echo off
chcp 65001 >nul
echo ========================================
echo       AI Blog Platform - Quick Start
echo ========================================
echo.

echo [1/3] Checking Docker status...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running. Please start Docker Desktop first.
    pause
    exit /b 1
)
echo ✅ Docker is running
echo.

echo [2/3] Starting services...
docker-compose up -d --build
if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)
echo.

echo [3/3] Waiting for services to be ready...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo       🎉 Started successfully!
echo ========================================
echo.
echo 🌐 Frontend: http://localhost
echo 🔗 Backend: http://localhost:3001
echo 📊 Database: localhost:3306
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost
echo.
echo Tips:
echo - View logs: docker-compose logs -f
echo - Stop services: docker-compose down
echo.
pause
