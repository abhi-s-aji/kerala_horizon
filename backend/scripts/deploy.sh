#!/bin/bash

# Kerala Horizon Backend Deployment Script
set -e

echo "🚀 Starting Kerala Horizon Backend Deployment..."

# Check if required environment variables are set
if [ -z "$FIREBASE_PROJECT_ID" ]; then
    echo "❌ FIREBASE_PROJECT_ID is not set"
    exit 1
fi

if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo "❌ GOOGLE_MAPS_API_KEY is not set"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Run tests
echo "🧪 Running tests..."
npm test -- --ci --passWithNoTests

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

# Generate version tag
VERSION="v$(date +%Y%m%d%H%M%S)"
echo "📋 Generated version: $VERSION"

# Deploy to Firebase Functions
echo "🔥 Deploying to Firebase Functions..."
firebase deploy --only functions --message "Deploying $VERSION"

# Deploy to Firebase Hosting (if applicable)
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting --message "Deploying $VERSION"

# Update Firestore indexes
echo "📊 Updating Firestore indexes..."
firebase deploy --only firestore:indexes

# Set up monitoring
echo "📈 Setting up monitoring..."
firebase functions:config:set monitoring.enabled=true

echo "✅ Deployment completed successfully!"
echo "🔗 Backend API: https://us-central1-$FIREBASE_PROJECT_ID.cloudfunctions.net/api"
echo "📊 Monitoring: https://console.firebase.google.com/project/$FIREBASE_PROJECT_ID/monitoring"

# Health check
echo "🏥 Running health check..."
curl -f https://us-central1-$FIREBASE_PROJECT_ID.cloudfunctions.net/api/health || {
    echo "❌ Health check failed"
    exit 1
}

echo "🎉 Kerala Horizon Backend is live and healthy!"







