#!/bin/bash

# Exit on error
set -e

echo "Building Document Redaction Tool for production..."

# Install dependencies if not already installed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build for production
echo "Creating optimized production build..."
npm run build

echo "Build completed successfully! Files are in the 'dist' directory."
echo "To deploy, copy the contents of the 'dist' directory to your web server."