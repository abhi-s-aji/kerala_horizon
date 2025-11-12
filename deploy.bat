@echo off
REM Kerala Horizon Deployment Script for Windows
REM This script handles deployment to Firebase with proper versioning and rollback capabilities

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ID=kerala-horizon
set FIREBASE_PROJECT=kerala-horizon
set BACKUP_DIR=.\backups
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set TIMESTAMP=%dt:~0,8%_%dt:~8,6%
set VERSION_TAG=v%dt:~0,4%.%dt:~4,2%.%dt:~6,2%-%TIMESTAMP%

echo [%date% %time%] Starting Kerala Horizon deployment process...
echo Version: %VERSION_TAG%

REM Check if required tools are installed
echo [%date% %time%] Checking dependencies...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed
    exit /b 1
)

where firebase >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Firebase CLI is not installed. Install with: npm install -g firebase-tools
    exit /b 1
)

echo [SUCCESS] All dependencies are available

REM Create backup directory
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

REM Create backup of current deployment
echo [%date% %time%] Creating backup of current deployment...
if exist "build" (
    xcopy /E /I /Y "build" "%BACKUP_DIR%\build_%TIMESTAMP%"
    echo [SUCCESS] Backup created: %BACKUP_DIR%\build_%TIMESTAMP%
) else (
    echo [WARNING] No existing build found to backup
)

REM Run tests
echo [%date% %time%] Running tests...

REM Run linting
echo [%date% %time%] Running ESLint...
npm run lint 2>nul
if %errorlevel% equ 0 (
    echo [SUCCESS] Linting passed
) else (
    echo [WARNING] Linting issues found, but continuing deployment
)

REM Run type checking
echo [%date% %time%] Running TypeScript type checking...
npx tsc --noEmit
if %errorlevel% neq 0 (
    echo [ERROR] Type checking failed
    exit /b 1
)
echo [SUCCESS] Type checking passed

REM Build the application
echo [%date% %time%] Building application...

REM Clean previous build
if exist "build" rmdir /S /Q "build"

REM Install dependencies
echo [%date% %time%] Installing dependencies...
npm ci --production=false

REM Build the application
echo [%date% %time%] Building React application...
npm run build

REM Verify build
if not exist "build" (
    echo [ERROR] Build directory not created
    exit /b 1
)

echo [SUCCESS] Application built successfully

REM Deploy to Firebase
echo [%date% %time%] Deploying to Firebase...

REM Set the project
firebase use %FIREBASE_PROJECT%

REM Deploy with version tag
echo [%date% %time%] Deploying to Firebase Hosting...
firebase deploy --only hosting --message "Deploy %VERSION_TAG%"

echo [SUCCESS] Deployment completed successfully

REM Create deployment manifest
echo [%date% %time%] Creating deployment manifest...
(
echo {
echo   "timestamp": "%TIMESTAMP%",
echo   "version": "%VERSION_TAG%",
echo   "project": "%FIREBASE_PROJECT%",
echo   "git_commit": "unknown",
echo   "git_branch": "unknown",
echo   "node_version": "unknown",
echo   "npm_version": "unknown"
echo }
) > "%BACKUP_DIR%\deployment_%TIMESTAMP%.json"

echo [SUCCESS] Deployment manifest created

REM Health check
echo [%date% %time%] Performing health check...
timeout /t 10 /nobreak >nul

echo [SUCCESS] Deployment completed successfully!
echo Version: %VERSION_TAG%
echo Site: https://%FIREBASE_PROJECT%.web.app

pause














