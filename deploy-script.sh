#!/bin/bash

# Trading Dashboard Deployment Script
# Automates the build and deployment process

set -e  # Exit on any error

# Configuration
APP_NAME="trading-dashboard"
BUILD_DIR="dist"
DEPLOY_DIR="deploy"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
VERSION_FILE="version.json"

echo "🚀 Starting deployment process for $APP_NAME"
echo "⏰ Build timestamp: $TIMESTAMP"

# Clean previous builds
echo "🧹 Cleaning previous build artifacts..."
rm -rf $BUILD_DIR $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production --silent

# Run type checks
echo "🔍 Running TypeScript checks..."
npx tsc --noEmit

# Build application
echo "🏗️ Building application..."
npm run build

# Create version info
echo "📝 Creating version information..."
cat > $VERSION_FILE << EOF
{
  "version": "${npm_package_version:-1.0.0}",
  "buildTime": "$TIMESTAMP",
  "gitCommit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
  "buildEnv": "production",
  "nodeVersion": "$(node --version)"
}
EOF

# Package deployment files
echo "📋 Packaging deployment files..."
cp -r $BUILD_DIR/* $DEPLOY_DIR/
cp README.md $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp $VERSION_FILE $DEPLOY_DIR/

# Create archive
echo "🗜️ Creating deployment archive..."
cd $DEPLOY_DIR
zip -r "../${APP_NAME}-${TIMESTAMP}.zip" .
tar -czf "../${APP_NAME}-${TIMESTAMP}.tar.gz" .
cd ..

echo "✅ Deployment package created successfully!"
echo "📦 Files:"
echo "   - ${APP_NAME}-${TIMESTAMP}.zip"
echo "   - ${APP_NAME}-${TIMESTAMP}.tar.gz"
echo "📁 Deployment directory: $DEPLOY_DIR"
echo ""
echo "🌐 Ready for upload to your hosting provider!"

# Cleanup
rm -f $VERSION_FILE

echo "🎉 Build process completed!"