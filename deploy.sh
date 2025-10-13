#!/bin/bash

# Kerala Horizon Deployment Script with Rollback Safeguards
# This script handles deployment to Firebase with proper versioning and rollback capabilities

set -e  # Exit on any error

# Configuration
PROJECT_ID="kerala-horizon"
FIREBASE_PROJECT="kerala-horizon"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VERSION_TAG="v$(date +"%Y.%m.%d")-${TIMESTAMP}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    if ! command -v firebase &> /dev/null; then
        error "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
        exit 1
    fi
    
    success "All dependencies are available"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup current build if it exists
    if [ -d "build" ]; then
        cp -r build "$BACKUP_DIR/build_$TIMESTAMP"
        success "Backup created: $BACKUP_DIR/build_$TIMESTAMP"
    else
        warning "No existing build found to backup"
    fi
}

# Run tests
run_tests() {
    log "Running tests..."
    
    # Run linting
    log "Running ESLint..."
    if npm run lint 2>/dev/null; then
        success "Linting passed"
    else
        warning "Linting issues found, but continuing deployment"
    fi
    
    # Run type checking
    log "Running TypeScript type checking..."
    if npx tsc --noEmit; then
        success "Type checking passed"
    else
        error "Type checking failed"
        exit 1
    fi
    
    # Run build tests
    log "Testing build process..."
    if npm run build; then
        success "Build test passed"
    else
        error "Build failed"
        exit 1
    fi
}

# Build the application
build_app() {
    log "Building application..."
    
    # Clean previous build
    rm -rf build
    
    # Install dependencies
    log "Installing dependencies..."
    npm ci --production=false
    
    # Build the application
    log "Building React application..."
    npm run build
    
    # Verify build
    if [ ! -d "build" ]; then
        error "Build directory not created"
        exit 1
    fi
    
    success "Application built successfully"
}

# Deploy to Firebase
deploy_to_firebase() {
    log "Deploying to Firebase..."
    
    # Login to Firebase (if not already logged in)
    if ! firebase projects:list &> /dev/null; then
        log "Please login to Firebase..."
        firebase login
    fi
    
    # Set the project
    firebase use "$FIREBASE_PROJECT"
    
    # Deploy with version tag
    log "Deploying to Firebase Hosting..."
    firebase deploy --only hosting --message "Deploy $VERSION_TAG"
    
    success "Deployment completed successfully"
}

# Create deployment manifest
create_manifest() {
    log "Creating deployment manifest..."
    
    cat > "$BACKUP_DIR/deployment_$TIMESTAMP.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "version": "$VERSION_TAG",
  "project": "$FIREBASE_PROJECT",
  "build_size": "$(du -sh build | cut -f1)",
  "files_count": "$(find build -type f | wc -l)",
  "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)"
}
EOF
    
    success "Deployment manifest created"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    # Find the latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/build_* 2>/dev/null | head -n1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        error "No backup found for rollback"
        exit 1
    fi
    
    log "Rolling back to: $LATEST_BACKUP"
    
    # Restore backup
    rm -rf build
    cp -r "$LATEST_BACKUP" build
    
    # Redeploy
    firebase deploy --only hosting --message "Rollback to previous version"
    
    success "Rollback completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for deployment to propagate
    sleep 10
    
    # Check if the site is accessible
    SITE_URL="https://$FIREBASE_PROJECT.web.app"
    
    if curl -f -s "$SITE_URL" > /dev/null; then
        success "Health check passed: $SITE_URL is accessible"
    else
        warning "Health check failed: $SITE_URL is not accessible"
    fi
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only the last 5 backups
    ls -t "$BACKUP_DIR"/build_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    ls -t "$BACKUP_DIR"/deployment_*.json 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
    
    success "Old backups cleaned up"
}

# Main deployment function
main() {
    log "Starting Kerala Horizon deployment process..."
    log "Version: $VERSION_TAG"
    
    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            create_backup
            run_tests
            build_app
            deploy_to_firebase
            create_manifest
            health_check
            cleanup_backups
            success "Deployment completed successfully!"
            log "Version: $VERSION_TAG"
            log "Site: https://$FIREBASE_PROJECT.web.app"
            ;;
        "rollback")
            rollback
            ;;
        "test")
            check_dependencies
            run_tests
            success "All tests passed!"
            ;;
        "backup")
            create_backup
            success "Backup created!"
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|test|backup}"
            echo "  deploy  - Full deployment process (default)"
            echo "  rollback - Rollback to previous version"
            echo "  test    - Run tests only"
            echo "  backup  - Create backup only"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"








