@echo off
setlocal enabledelayedexpansion

title Nestle SmartFlow - Database Import

echo.
echo ========================================
echo Nestle SmartFlow Database Import Tool
echo ========================================
echo.

REM Try common MySQL installation paths
set "MYSQL_PATHS=C:\Program Files\MySQL\MySQL Server 8.0\bin C:\Program Files\MySQL\MySQL Server 5.7\bin C:\Program Files\MariaDB 10.5\bin C:\Program Files\MariaDB 10.6\bin C:\Program Files\MariaDB 11.0\bin"

set "MYSQL_FOUND="
for %%P in (%MYSQL_PATHS%) do (
    if exist "%%P\mysql.exe" (
        set "MYSQL_FOUND=%%P"
        goto :found_mysql
    )
)

:found_mysql
if not "!MYSQL_FOUND!"=="" (
    echo ✓ MySQL found at: !MYSQL_FOUND!
    echo.
) else (
    echo ✗ MySQL not found in common installation paths
    echo.
    echo Please specify your MySQL bin directory:
    echo Example: C:\Program Files\MySQL\MySQL Server 8.0\bin
    echo.
    set /p MYSQL_FOUND="MySQL bin path: "
    
    if not exist "!MYSQL_FOUND!\mysql.exe" (
        echo.
        echo ERROR: mysql.exe not found at !MYSQL_FOUND!
        pause
        exit /b 1
    )
)

echo.
echo Verifying database file...
if not exist "nestle_smartflow_mysql.sql" (
    echo ERROR: nestle_smartflow_mysql.sql not found!
    echo Please ensure you run this from: d:\APIIT\Thushain\CC 2\Web App
    pause
    exit /b 1
)

echo ✓ Database file found: nestle_smartflow_mysql.sql
echo.

REM Get MySQL password
set /p MYSQL_PASSWORD="Enter MySQL root password (press Enter if no password): "

echo.
echo ========================================
echo Importing database...
echo ========================================
echo.

REM Import the database
if "!MYSQL_PASSWORD!"=="" (
    "!MYSQL_FOUND!\mysql.exe" -u root < "nestle_smartflow_mysql.sql"
) else (
    "!MYSQL_FOUND!\mysql.exe" -u root -p!MYSQL_PASSWORD! < "nestle_smartflow_mysql.sql"
)

if errorlevel 1 (
    echo.
    echo ========================================
    echo ERROR: Import failed!
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS: Database imported!
echo ========================================
echo.
echo Database: nestle_smartflow
echo Tables: 11
echo Default users: 5
echo Sample data: Products, Orders, Inventory
echo.
echo Verifying import...
echo.

REM Verify tables
if "!MYSQL_PASSWORD!"=="" (
    "!MYSQL_FOUND!\mysql.exe" -u root -e "USE nestle_smartflow; SHOW TABLES;"
) else (
    "!MYSQL_FOUND!\mysql.exe" -u root -p!MYSQL_PASSWORD! -e "USE nestle_smartflow; SHOW TABLES;"
)

echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Start PHP server:
echo    cd nestle_api
echo    php -S localhost:8000
echo.
echo 2. Open API Tester:
echo    http://localhost:8000/api_tester.html
echo.
echo 3. Login with:
echo    Email: admin@gmail.com
echo    Password: password123
echo.
pause
