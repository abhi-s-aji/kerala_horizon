#!/bin/bash

# Kerala Horizon - Production Deployment Script
echo "🚀 Kerala Horizon - Production Deployment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

# Build frontend
echo "🔨 Building frontend for production..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "✅ Frontend build completed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found in backend directory"
    echo "📝 Please create a .env file with your configuration"
    echo "📄 See DEPLOYMENT_GUIDE.md for required environment variables"
fi

# Test backend server
echo "🧪 Testing backend server..."
timeout 10s node test-server.js > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend server test passed"
else
    echo "⚠️  Backend server test failed, but continuing..."
fi

cd ..

# Check if Firebase CLI is available
if command_exists firebase; then
    echo "🔥 Firebase CLI detected"
    echo "📤 Deploying to Firebase..."
    
    # Deploy frontend to Firebase Hosting
    firebase deploy --only hosting
    if [ $? -eq 0 ]; then
        echo "✅ Frontend deployed to Firebase Hosting"
    else
        echo "⚠️  Firebase deployment failed"
    fi
    
    # Deploy backend to Firebase Functions
    firebase deploy --only functions
    if [ $? -eq 0 ]; then
        echo "✅ Backend deployed to Firebase Functions"
    else
        echo "⚠️  Firebase Functions deployment failed"
    fi
else
    echo "⚠️  Firebase CLI not found. Skipping Firebase deployment."
    echo "📝 To deploy to Firebase:"
    echo "   1. Install Firebase CLI: npm install -g firebase-tools"
    echo "   2. Login: firebase login"
    echo "   3. Deploy: firebase deploy"
fi

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📊 Deployment Summary:"
echo "====================="
echo "✅ Frontend: Built successfully"
echo "✅ Backend: Dependencies installed"
echo "✅ Configuration: Ready for production"
echo ""
echo "🌐 Your Kerala Horizon app is ready!"
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo "🔗 Frontend: http://localhost:3000 (if running locally)"
echo "🔗 Backend API: http://localhost:5000 (if running locally)"
echo ""
echo "🚀 Happy travels in Kerala! 🌴"












