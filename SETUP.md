# Kids Story App Backend - Setup Guide

This guide will help you set up the Kids Story App backend API for development and production.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18.0.0 or higher
- MongoDB 5.0 or higher
- npm or yarn package manager

### 2. Installation
```bash
# Clone and navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Environment Configuration
Edit the `.env` file with your configuration:

```env
# Required Configuration
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/kids-story-app
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Google OAuth (Required for Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Optional Configuration
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
BCRYPT_ROUNDS=12
```

### 4. Database Setup
```bash
# Start MongoDB (if not using Docker)
sudo systemctl start mongod

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo:5.0

# Seed the database with sample data
npm run seed
```

### 5. Start the Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000/api/v1`

## 🐳 Docker Setup

### Using Docker Compose (Recommended)
```bash
# Start all services (API + MongoDB + Redis)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Using Docker Only
```bash
# Build the image
docker build -t kids-story-api .

# Run with environment file
docker run -d -p 3000:3000 --env-file .env kids-story-api
```

## 🔧 Development Setup

### 1. Install Development Dependencies
```bash
npm install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### 3. Code Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### 4. Database Seeding
```bash
# Seed with sample data
npm run seed
```

## 🌐 API Testing

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Get Content
```bash
curl http://localhost:3000/api/v1/content
```

## 🔐 Authentication Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Client Secret to `.env`

### JWT Configuration
Generate secure secrets for JWT tokens:
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitoring and Logging

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

### Health Monitoring
- Basic: `GET /api/v1/health`
- Detailed: `GET /api/v1/health/detailed`

## 🚀 Production Deployment

### Environment Variables
Set these in production:
```env
NODE_ENV=production
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
GOOGLE_CLIENT_ID=your-production-google-client-id
CORS_ORIGIN=https://yourdomain.com
```

### Using PM2 (Process Manager)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/server.js --name kids-story-api

# Monitor
pm2 monit

# View logs
pm2 logs kids-story-api

# Restart
pm2 restart kids-story-api
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 Troubleshooting

### Common Issues

#### MongoDB Connection Error
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in .env
```

#### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port in .env
PORT=3001
```

#### JWT Token Issues
- Ensure JWT_SECRET is set and secure
- Check token expiration settings
- Verify token format in Authorization header

#### Google OAuth Issues
- Verify Google Client ID and Secret
- Check authorized redirect URIs
- Ensure Google+ API is enabled

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Or set in .env
LOG_LEVEL=debug
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Include JWT token in requests:
```
Authorization: Bearer <your-access-token>
```

### Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

### Key Endpoints
- `POST /auth/register` - Register user
- `POST /auth/login` - Login user
- `POST /auth/google` - Google OAuth
- `GET /users/me` - Get user profile
- `GET /content` - Get content list
- `POST /kids` - Create kid profile
- `GET /favorites` - Get user favorites
- `POST /progress` - Update progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📞 Support

For issues and questions:
- Check this setup guide
- Review the main README.md
- Create an issue in the repository
- Contact the development team
