@echo off
REM Nestle SmartFlow Database Setup Script
REM This script imports the database schema from NestleFlow_DB.sql

setlocal enabledelayedexpansion

echo.
echo ================================
echo Nestle SmartFlow Database Setup
echo ================================
echo.

REM Check if NestleFlow_DB.sql exists
if not exist "NestleFlow_DB.sql" (
    echo ERROR: NestleFlow_DB.sql not found in current directory!
    echo Please ensure you run this script from: d:\APIIT\Thushain\CC 2\Web App
    pause
    exit /b 1
)

echo Found database schema: NestleFlow_DB.sql
echo.

REM Check if MySQL is installed
where mysql >nul 2>nul
if errorlevel 1 (
    echo ERROR: MySQL/MariaDB not found!
    echo Please install MySQL or MariaDB and add it to your PATH
    echo.
    echo Typical paths:
    echo   - C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo   - C:\Program Files\MariaDB 10.x\bin
    pause
    exit /b 1
)

echo MySQL found!
echo.
echo Attempting to import database...
echo Note: You may be prompted for MySQL root password
echo.

REM Import the database
mysql -u root -p < NestleFlow_DB.sql

if errorlevel 1 (
    echo.
    echo ERROR: Database import failed!
    echo.
    echo Troubleshooting:
    echo 1. Verify MySQL/MariaDB is running
    echo 2. Check root password is correct
    echo 3. Ensure NestleFlow_DB.sql has valid SQL syntax
    pause
    exit /b 1
)

echo.
echo ================================
echo SUCCESS: Database imported!
echo ================================
echo.
echo Database: nestle_smartflow
echo Tables: users, products, inventory, orders, order_items, shipments, etc.
echo.
echo Next steps:
echo 1. Start PHP server: php -S localhost:8000
echo 2. Open API Tester: http://localhost:8000/api_tester.html
echo 3. Test the APIs using pre-filled example data
echo.
pause
