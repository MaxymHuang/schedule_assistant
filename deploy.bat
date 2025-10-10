@echo off
REM Equipment Lending System - Windows Deployment Wrapper
REM This batch file provides an easy way to run the PowerShell deployment script

echo ===============================================
echo   Equipment Lending System - Quick Deploy
echo ===============================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell or run the script manually.
    pause
    exit /b 1
)

REM Check if we're in the correct directory
if not exist "docker-compose.prod.yml" (
    echo ERROR: docker-compose.prod.yml not found.
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if the PowerShell script exists
if not exist "deploy-windows.ps1" (
    echo ERROR: deploy-windows.ps1 not found.
    echo Please ensure the deployment script is in the same directory.
    pause
    exit /b 1
)

echo Starting deployment...
echo.

REM Run the PowerShell script with execution policy bypass
powershell -ExecutionPolicy Bypass -File "deploy-windows.ps1" %*

REM Check if deployment was successful
if %errorlevel% equ 0 (
    echo.
    echo ===============================================
    echo   Deployment completed successfully!
    echo ===============================================
    echo.
    echo The Equipment Lending System is now running.
    echo Open your web browser and navigate to:
    echo   http://localhost
    echo.
    echo Default login credentials:
    echo   Email: admin@admin.com
    echo   Password: admin123
    echo.
    echo IMPORTANT: Change the admin password after first login!
    echo.
) else (
    echo.
    echo ===============================================
    echo   Deployment failed!
    echo ===============================================
    echo.
    echo Please check the error messages above and try again.
    echo.
)

echo Press any key to exit...
pause >nul
