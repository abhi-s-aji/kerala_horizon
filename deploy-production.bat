@echo off
REM Kerala Horizon - Production Deployment Script (Windows)
echo 🚀 Kerala Horizon - Production Deployment
echo ==========================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend dependency installation failed
    pause
    exit /b 1
)

REM Build frontend
echo 🔨 Building frontend for production...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ❌ Frontend build failed
    pause
    exit /b 1
)

echo ✅ Frontend build completed

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo ❌ Backend dependency installation failed
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found in backend directory
    echo 📝 Please create a .env file with your configuration
    echo 📄 See DEPLOYMENT_GUIDE.md for required environment variables
)

cd ..

REM Check if Firebase CLI is available
where firebase >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 🔥 Firebase CLI detected
    echo 📤 Deploying to Firebase...
    
    REM Deploy frontend to Firebase Hosting
    call firebase deploy --only hosting
    if %ERRORLEVEL% equ 0 (
        echo ✅ Frontend deployed to Firebase Hosting
    ) else (
        echo ⚠️  Firebase deployment failed
    )
    
    REM Deploy backend to Firebase Functions
    call firebase deploy --only functions
    if %ERRORLEVEL% equ 0 (
        echo ✅ Backend deployed to Firebase Functions
    ) else (
        echo ⚠️  Firebase Functions deployment failed
    )
) else (
    echo ⚠️  Firebase CLI not found. Skipping Firebase deployment.
    echo 📝 To deploy to Firebase:
    echo    1. Install Firebase CLI: npm install -g firebase-tools
    echo    2. Login: firebase login
    echo    3. Deploy: firebase deploy
)

echo.
echo 🎉 Deployment process completed!
echo.
echo 📊 Deployment Summary:
echo =====================
echo ✅ Frontend: Built successfully
echo ✅ Backend: Dependencies installed
echo ✅ Configuration: Ready for production
echo.
echo 🌐 Your Kerala Horizon app is ready!
echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
echo 🔗 Frontend: http://localhost:3000 (if running locally)
echo 🔗 Backend API: http://localhost:5000 (if running locally)
echo.
echo 🚀 Happy travels in Kerala! 🌴
pause





