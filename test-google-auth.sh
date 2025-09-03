#!/bin/bash

# Google Authentication Test Setup Script
# This script helps you set up and test Google authentication

echo "🧸 Kids Story API - Google Authentication Test Setup"
echo "=================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
    else
        echo "❌ .env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Check if required environment variables are set
echo ""
echo "🔍 Checking environment configuration..."

if grep -q "GOOGLE_CLIENT_ID=your-google-client-id" .env; then
    echo "⚠️  GOOGLE_CLIENT_ID is not configured in .env file"
    echo "   Please update .env with your Google Client ID from Google Cloud Console"
fi

if grep -q "JWT_SECRET=your-super-secret-jwt-key-here" .env; then
    echo "⚠️  JWT_SECRET is using default value in .env file"
    echo "   Please update .env with a secure JWT secret"
fi

if grep -q "MONGODB_URI=mongodb://localhost:27017/kids-story-app" .env; then
    echo "ℹ️  Using default MongoDB URI (localhost:27017)"
fi

# Check if dependencies are installed
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies are installed"
fi

# Check if MongoDB is running
echo ""
echo "🍃 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is running and accessible"
    else
        echo "⚠️  MongoDB is not accessible. Please start MongoDB:"
        echo "   sudo systemctl start mongod"
        echo "   or use Docker: docker run -d -p 27017:27017 mongo:5.0"
    fi
elif command -v mongo &> /dev/null; then
    mongo --eval "db.adminCommand('ping')" --quiet > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ MongoDB is running and accessible"
    else
        echo "⚠️  MongoDB is not accessible. Please start MongoDB"
    fi
else
    echo "⚠️  MongoDB client not found. Please install MongoDB or use Docker"
fi

# Seed database if needed
echo ""
echo "🌱 Database seeding..."
read -p "Do you want to seed the database with sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️  Database seeding failed (this is okay if data already exists)"
    fi
fi

# Start the server
echo ""
echo "🚀 Starting the development server..."
echo "   The API will be available at: http://localhost:3000/api/v1"
echo "   Health check: http://localhost:3000/api/v1/health"
echo ""
echo "📋 Testing Options:"
echo "   1. Open tests/google-auth-test.html in your browser for interactive testing"
echo "   2. Run: node tests/manual-google-auth-test.js <GOOGLE_ID_TOKEN>"
echo "   3. Run: npm test (for automated tests)"
echo ""
echo "🔑 To get a Google ID token for testing:"
echo "   1. Go to: https://developers.google.com/oauthplayground/"
echo "   2. Select 'Google OAuth2 API v2' -> 'userinfo.email'"
echo "   3. Authorize and exchange for tokens"
echo "   4. Copy the 'id_token' value"
echo ""

# Ask if user wants to start the server
read -p "Start the development server now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting server..."
    npm run dev
else
    echo ""
    echo "To start the server manually, run: npm run dev"
    echo "To run tests, use: npm test"
    echo ""
    echo "Happy testing! 🎉"
fi
