# Equipment Lending System - Windows Production Deployment Script
# This script automates the deployment of the Equipment Lending System to production

param(
    [string]$ServerIP = "localhost",
    [string]$AdminPassword = "admin123",
    [string]$DbPassword = "secure_password_123",
    [string]$SecretKey = "",
    [switch]$SkipDockerCheck,
    [switch]$ForceRebuild,
    [switch]$Help
)

# Display help information
if ($Help) {
    Write-Host @"
Equipment Lending System - Windows Production Deployment Script

USAGE:
    .\deploy-windows.ps1 [OPTIONS]

OPTIONS:
    -ServerIP <ip>         Server IP address (default: localhost)
    -AdminPassword <pass>  Admin account password (default: admin123)
    -DbPassword <pass>     Database password (default: secure_password_123)
    -SecretKey <key>       JWT secret key (auto-generated if not provided)
    -SkipDockerCheck       Skip Docker installation check
    -ForceRebuild          Force rebuild of all containers
    -Help                  Show this help message

EXAMPLES:
    .\deploy-windows.ps1
    .\deploy-windows.ps1 -ServerIP "192.168.1.100" -AdminPassword "MySecurePass123"
    .\deploy-windows.ps1 -ForceRebuild -DbPassword "SuperSecureDBPass456"

"@
    exit 0
}

# Script configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Color functions for better output
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Step { param($Message) Write-Host "[STEP] $Message" -ForegroundColor Blue }

# Main deployment function
function Deploy-EquipmentLendingSystem {
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host "  Equipment Lending System - Production Deploy" -ForegroundColor Magenta
    Write-Host "===============================================" -ForegroundColor Magenta
    Write-Host ""

    try {
        # Step 1: Environment validation
        Test-Environment
        
        # Step 2: Docker validation
        if (-not $SkipDockerCheck) {
            Test-DockerInstallation
        }
        
        # Step 3: Generate secure configuration
        $config = New-SecureConfiguration
        
        # Step 4: Create environment files
        New-EnvironmentFiles -Config $config
        
        # Step 5: Deploy with Docker Compose
        Deploy-WithDockerCompose -Config $config
        
        # Step 6: Health checks
        Test-ServiceHealth -Config $config
        
        # Step 7: Display access information
        Show-AccessInformation -Config $config
        
        Write-Success "Deployment completed successfully!"
        
    } catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Info "Check the logs above for detailed error information."
        exit 1
    }
}

# Test environment prerequisites
function Test-Environment {
    Write-Step "Validating environment prerequisites..."
    
    # Check if we're in the correct directory
    if (-not (Test-Path "docker-compose.prod.yml")) {
        throw "docker-compose.prod.yml not found. Please run this script from the project root directory."
    }
    
    # Check if backend and frontend directories exist
    if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
        throw "Backend or frontend directories not found. Please ensure you're in the correct project directory."
    }
    
    # Check PowerShell version (require 5.1+)
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        throw "PowerShell 5.1 or higher is required. Current version: $($psVersion.ToString())"
    }
    
    Write-Success "Environment validation passed"
}

# Test Docker installation and availability
function Test-DockerInstallation {
    Write-Step "Checking Docker installation..."
    
    try {
        $dockerVersion = docker --version 2>$null
        if (-not $dockerVersion) {
            throw "Docker is not installed or not in PATH"
        }
        Write-Success "Docker found: $dockerVersion"
        
        # Check if Docker daemon is running
        $dockerInfo = docker info 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Docker daemon is not running. Please start Docker Desktop."
        }
        # Check if we got actual info (ignore warnings)
        if ($dockerInfo -match "Server Version:" -or $dockerInfo -match "Containers:" -or $dockerInfo -match "Images:") {
            Write-Success "Docker daemon is running"
        } else {
            throw "Docker daemon is not responding properly"
        }
        
        # Check Docker Compose
        $composeVersion = docker-compose --version 2>$null
        if (-not $composeVersion) {
            throw "Docker Compose is not installed or not in PATH"
        }
        Write-Success "Docker Compose found: $composeVersion"
        
    } catch {
        Write-Error "Docker validation failed: $($_.Exception.Message)"
        Write-Info "Please install Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop"
        throw
    }
}

# Generate secure configuration
function New-SecureConfiguration {
    Write-Step "Generating secure configuration..."
    
    # Generate secret key if not provided
    if (-not $SecretKey) {
        $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
        $SecretKey = ""
        for ($i = 0; $i -lt 64; $i++) {
            $SecretKey += $chars[(Get-Random -Maximum $chars.Length)]
        }
        Write-Info "Generated secure JWT secret key"
    }
    
    # Validate passwords
    if ($AdminPassword.Length -lt 6) {
        throw "Admin password must be at least 6 characters long"
    }
    
    if ($DbPassword.Length -lt 8) {
        throw "Database password must be at least 8 characters long"
    }
    
    $config = @{
        ServerIP = $ServerIP
        AdminPassword = $AdminPassword
        DbPassword = $DbPassword
        SecretKey = $SecretKey
        DbName = "equipment_lending"
        DbUser = "equipment_user"
        ApiPort = "8000"
        WebPort = "80"
    }
    
    Write-Success "Configuration generated successfully"
    return $config
}

# Create environment files
function New-EnvironmentFiles {
    param($Config)
    
    Write-Step "Creating environment configuration files..."
    
    # Backend environment file
    $backendEnv = @"
# PostgreSQL Database Configuration
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=$($Config.DbName)
POSTGRES_USER=$($Config.DbUser)
POSTGRES_PASSWORD=$($Config.DbPassword)

# JWT Configuration
SECRET_KEY=$($Config.SecretKey)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
ENVIRONMENT=production
DOCKER_CONTAINER=true
"@
    
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8 -Force
    Write-Success "Backend environment file created"
    
    # Frontend environment file
    $frontendEnv = @"
# API Configuration
VITE_API_URL=http://$($Config.ServerIP):$($Config.ApiPort)

# Application Configuration
VITE_APP_TITLE=Equipment Lending System
VITE_APP_VERSION=1.0.0
"@
    
    $frontendEnv | Out-File -FilePath "frontend\.env" -Encoding UTF8 -Force
    Write-Success "Frontend environment file created"
}

# Deploy with Docker Compose
function Deploy-WithDockerCompose {
    param($Config)
    
    Write-Step "Deploying services with Docker Compose..."
    
    # Stop existing containers
    Write-Info "Stopping existing containers..."
    docker-compose -f docker-compose.prod.yml down 2>$null
    
    # Build and start services
    $buildArgs = @("-f", "docker-compose.prod.yml", "up", "-d")
    if ($ForceRebuild) {
        $buildArgs += "--build"
        Write-Info "Force rebuild enabled - rebuilding all images"
    }
    
    Write-Info "Starting services..."
    & docker-compose @buildArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose deployment failed"
    }
    
    Write-Success "Services deployed successfully"
    
    # Wait for services to be ready
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Check service status
    $services = docker-compose -f docker-compose.prod.yml ps --services
    foreach ($service in $services) {
        $status = docker-compose -f docker-compose.prod.yml ps $service --format "table {{.State}}"
        if ($status -match "running") {
            Write-Success "$service is running"
        } else {
            Write-Warning "$service status: $status"
        }
    }
}

# Test service health
function Test-ServiceHealth {
    param($Config)
    
    Write-Step "Performing health checks..."
    
    # Test backend health
    $maxRetries = 10
    $retryCount = 0
    
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://$($Config.ServerIP):$($Config.ApiPort)/health" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Backend API is healthy"
                break
            }
        } catch {
            $retryCount++
            if ($retryCount -ge $maxRetries) {
                Write-Warning "Backend health check failed after $maxRetries attempts"
                break
            }
            Write-Info "Backend not ready yet, retrying in 5 seconds... ($retryCount/$maxRetries)"
            Start-Sleep -Seconds 5
        }
    } while ($retryCount -lt $maxRetries)
    
    # Test frontend
    $maxRetries = 10
    $retryCount = 0
    
    do {
        try {
            $response = Invoke-WebRequest -Uri "http://$($Config.ServerIP)" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Frontend is accessible"
                break
            }
        } catch {
            $retryCount++
            if ($retryCount -ge $maxRetries) {
                Write-Warning "Frontend health check failed after $maxRetries attempts"
                break
            }
            Write-Info "Frontend not ready yet, retrying in 5 seconds... ($retryCount/$maxRetries)"
            Start-Sleep -Seconds 5
        }
    } while ($retryCount -lt $maxRetries)
}

# Display access information
function Show-AccessInformation {
    param($Config)
    
    Write-Host ""
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host "  Deployment Complete! Access Information" -ForegroundColor Green
    Write-Host "===============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Application URLs:" -ForegroundColor Yellow
    Write-Host "   Frontend:    http://$($Config.ServerIP)" -ForegroundColor White
    Write-Host "   Backend API: http://$($Config.ServerIP):$($Config.ApiPort)" -ForegroundColor White
    Write-Host "   API Docs:    http://$($Config.ServerIP):$($Config.ApiPort)/docs" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Default Login Credentials:" -ForegroundColor Yellow
    Write-Host "   Email:    admin@admin.com" -ForegroundColor White
    Write-Host "   Password: $($Config.AdminPassword)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Security Recommendations:" -ForegroundColor Red
    Write-Host "   1. Change the admin password immediately after first login" -ForegroundColor White
    Write-Host "   2. Update the JWT secret key in production" -ForegroundColor White
    Write-Host "   3. Configure firewall to restrict access to necessary ports" -ForegroundColor White
    Write-Host "   4. Enable SSL/TLS for production use" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Management Commands:" -ForegroundColor Yellow
    Write-Host "   View logs:     docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
    Write-Host "   Stop services: docker-compose -f docker-compose.prod.yml down" -ForegroundColor White
    Write-Host "   Restart:       docker-compose -f docker-compose.prod.yml restart" -ForegroundColor White
    Write-Host "   Update:        docker-compose -f docker-compose.prod.yml up -d --build" -ForegroundColor White
    Write-Host ""
}

# Utility function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Main execution
if (-not (Test-Administrator)) {
    Write-Warning "This script is not running as Administrator. Some operations may require elevated privileges."
    Write-Info "If you encounter permission issues, try running PowerShell as Administrator."
    Write-Host ""
}

# Execute deployment
Deploy-EquipmentLendingSystem
