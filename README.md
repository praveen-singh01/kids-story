# Kids Story App - Backend API

A comprehensive Node.js backend API for the Kids Story App, a Flutter-based bedtime story application. This API provides user authentication, content management, avatar customization, favorites, progress tracking, and subscription management.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with Google OAuth integration
- **User Management**: User profiles, kid profiles, and subscription management
- **Content Management**: Stories, meditations, sounds with filtering and search
- **Progress Tracking**: User progress tracking for content consumption
- **Favorites System**: Save and manage favorite content
- **Avatar Management**: Customizable avatar system
- **Payment Integration**: External payment microservice integration
- **Security**: Rate limiting, input validation, security headers
- **Monitoring**: Comprehensive logging and health checks

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Google OAuth
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Express Validator + Joi
- **File Storage**: AWS S3 + CloudFront (configured)

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- MongoDB 5.0 or higher
- npm or yarn package manager

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kids-story-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/kids-story-app
   JWT_SECRET=your-super-secret-jwt-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   # ... other configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:5.0
   ```

5. **Run the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth authentication
- `POST /auth/verify-email` - Verify email address
- `POST /auth/refresh` - Refresh access token

### User Management
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `DELETE /users/me` - Delete user account
- `GET /users/me/subscription` - Get subscription details

### Kid Profiles
- `GET /kids` - List kid profiles
- `POST /kids` - Create kid profile
- `GET /kids/:id` - Get specific kid profile
- `PATCH /kids/:id` - Update kid profile
- `DELETE /kids/:id` - Delete kid profile

### Content
- `GET /content` - List content with filtering
- `GET /content/search` - Search content
- `GET /content/featured` - Get featured content
- `GET /content/:slug` - Get content by slug
- `GET /content/type/:type` - Get content by type

### Avatars
- `GET /avatars` - Get available avatars
- `GET /avatars/:id` - Get specific avatar

### Explore
- `GET /explore/categories` - Get browse categories
- `GET /explore/continue` - Get continue playing items
- `GET /explore/collections` - Get featured collections
- `GET /explore/collections/:id` - Get collection content

### Favorites
- `GET /favorites` - Get user favorites
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:id` - Remove from favorites
- `GET /favorites/check/:contentId` - Check favorite status

### Progress
- `POST /progress` - Update content progress
- `GET /progress/:contentId` - Get progress for content
- `GET /progress` - Get all user progress
- `DELETE /progress/:contentId` - Reset progress

### Subscriptions
- `GET /subscriptions/me` - Get current subscription
- `POST /subscriptions` - Create subscription
- `PATCH /subscriptions/me` - Update subscription
- `POST /subscriptions/me/cancel` - Cancel subscription
- `GET /subscriptions/plans` - Get available plans
- `POST /subscriptions/webhooks` - Payment webhooks

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check

## 🔒 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

### Google OAuth Flow
1. Client obtains Google ID token
2. Send ID token to `POST /auth/google`
3. Receive access token and refresh token
4. Use access token for authenticated requests

## 📊 Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:
```json
{
  "success": false,
  "error": ["Error message 1", "Error message 2"],
  "message": "Error description"
}
```

## 🛡 Security Features

- **Rate Limiting**: Different limits for different endpoint types
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js for security headers
- **CORS**: Configurable cross-origin resource sharing
- **Authentication**: JWT with refresh token rotation
- **Input Sanitization**: XSS prevention

## 📝 Logging

The application uses Winston for logging with different levels:
- **Error**: Application errors and exceptions
- **Warn**: Warning messages and rate limit violations
- **Info**: General application flow and important events
- **Debug**: Detailed debugging information

Logs are written to:
- Console (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong JWT secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- All other required variables from `.env.example`

### Production Considerations
- Use a process manager like PM2
- Set up MongoDB replica set for high availability
- Configure reverse proxy (nginx) for SSL termination
- Set up monitoring and alerting
- Configure log rotation
- Use environment-specific configuration

### Docker Deployment
```bash
# Build Docker image
docker build -t kids-story-api .

# Run container
docker run -d -p 3000:3000 --env-file .env kids-story-api
```

## 📚 Database Schema

The application uses MongoDB with the following collections:
- **users** - User accounts and authentication
- **kids** - Kid profiles associated with users
- **content** - Stories, meditations, and other content
- **favorites** - User favorite content items
- **categories** - Content categories and collections
- **progress** - User progress tracking
- **avatars** - Available avatar options

## 🔧 Development

### Code Structure
```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API route handlers
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Application entry point
```

### Adding New Features
1. Create model in `models/` if needed
2. Add business logic in `services/`
3. Create route handlers in `routes/`
4. Add validation middleware
5. Update documentation
6. Add tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the API documentation

## 🔄 API Versioning

The API uses URL versioning (`/api/v1/`). When breaking changes are introduced, a new version will be created while maintaining backward compatibility for existing versions.
