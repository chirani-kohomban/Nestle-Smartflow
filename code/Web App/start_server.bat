@echo off
REM Nestle SmartFlow - Start PHP Development Server

setlocal enabledelayedexpansion

echo.
echo ================================
echo Nestle SmartFlow API Server
echo ================================
echo.

REM Check if PHP is installed
where php >nul 2>nul
if errorlevel 1 (
    echo ERROR: PHP not found!
    echo Please install PHP and add it to your PATH
    echo.
    echo Download from: https://www.php.net/downloads
    pause
    exit /b 1
)

echo PHP found!
echo.

REM Check if nestle_api directory exists
if not exist "nestle_api" (
    echo ERROR: nestle_api directory not found!
    echo Please run this from: d:\APIIT\Thushain\CC 2\Web App
    pause
    exit /b 1
)

echo.
echo Starting PHP Development Server...
echo.
echo =====================================
echo Server running at: http://localhost:8000
echo =====================================
echo.
echo Available endpoints:
echo   - API Tester:  http://localhost:8000/api_tester.html
echo   - Login:       http://localhost:8000/login.php
echo   - Register:    http://localhost:8000/register.php
echo   - Get Users:   http://localhost:8000/get_users.php
echo   - Get Products: http://localhost:8000/get_products.php
echo   - Get Inventory: http://localhost:8000/get_inventory.php
echo   - Get Orders:  http://localhost:8000/get_orders.php
echo   - Add Shipment: http://localhost:8000/add_shipment.php
echo   - Record Sale: http://localhost:8000/record_sale.php
echo   - Update Inventory: http://localhost:8000/update_inventory.php
echo.
echo Press Ctrl+C to stop the server
echo =====================================
echo.

REM Start the PHP server
cd nestle_api
php -S localhost:8000

if errorlevel 1 (
    echo.
    echo ERROR: Failed to start PHP server!
    echo Please check:
    echo   1. Port 8000 is not in use
    echo   2. PHP is properly installed
    echo   3. nestle_api directory exists and contains PHP files
    pause
    exit /b 1
)

pause
