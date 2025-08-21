# 🌙 Bedtime Stories API

A production-grade Node.js + Express backend for a Kids Bedtime Stories MVP, featuring Google OAuth authentication, content management, and subscription handling.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- Docker and Docker Compose
- Google OAuth Client ID

### 1. Clone and Setup

```bash
git clone <repository-url>
cd bedtime-backend
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```bash
# Required: Set your Google OAuth Client ID
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Optional: Update other settings as needed
JWT_ACCESS_SECRET=your_secure_access_secret
JWT_REFRESH_SECRET=your_secure_refresh_secret
```

### 3. Start with Docker

```bash
# Start all services (API, MongoDB, Redis)
docker-compose up -d

# Check health
curl http://localhost:3000/healthz

# Seed sample content
npm run seed
```

### 4. Set Up Admin Dashboard

```bash
# Install admin dashboard dependencies
cd admin
npm install

# Start admin dashboard (in a new terminal)
npm run dev
```

### 5. Access the Services

- **API**: http://localhost:3000
- **Admin Dashboard**: http://localhost:5173
- **Documentation**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/healthz
- **MongoDB Admin** (dev): http://localhost:8081 (admin/admin)
- **Redis Admin** (dev): http://localhost:8082

> **Admin Dashboard**: Use the beautiful admin interface to manage content, users, and analytics. See [ADMIN_SETUP.md](./ADMIN_SETUP.md) for detailed setup instructions.

## 📚 API Documentation

### Authentication Flow

1. **Google Authentication**
```bash
curl -X POST http://localhost:3000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "YOUR_GOOGLE_ID_TOKEN"}'
```

2. **Use Access Token**
```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/me
```

3. **Refresh Token**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### Core Endpoints

#### Kids Management
```bash
# Get all kids
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/kids

# Create kid profile
curl -X POST http://localhost:3000/api/v1/kids \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Emma", "ageRange": "6-8", "avatarKey": "unicorn"}'

# Update kid preferences
curl -X PUT http://localhost:3000/api/v1/kids/KID_ID/preferences \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["folk_tales", "calming"], "sleepGoals": ["Sleep better"]}'
```

#### Content Discovery
```bash
# Get home content (highlights + recommendations)
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/home?kidId=KID_ID"

# Explore content with filters
curl "http://localhost:3000/api/v1/explore/list?type=story&ageRange=6-8&sort=popular&limit=10"

# Search content
curl "http://localhost:3000/api/v1/explore/search?q=dragon&type=story"

# Get content by slug
curl http://localhost:3000/api/v1/content/the-sleepy-forest
```

#### Favorites Management
```bash
# Add to favorites
curl -X POST http://localhost:3000/api/v1/favorites \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"kidId": "KID_ID", "contentId": "CONTENT_ID"}'

# Get favorites for a kid
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3000/api/v1/favorites?kidId=KID_ID"

# Remove from favorites
curl -X DELETE "http://localhost:3000/api/v1/favorites/CONTENT_ID?kidId=KID_ID" \
  -H "Authorization: Bearer TOKEN"
```

#### Subscription Management
```bash
# Get subscription status
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/subscription

# Create checkout session
curl -X POST http://localhost:3000/api/v1/subscription/checkout \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium",
    "successUrl": "https://app.example.com/success",
    "cancelUrl": "https://app.example.com/cancel"
  }'

# Cancel subscription
curl -X POST http://localhost:3000/api/v1/subscription/cancel \
  -H "Authorization: Bearer TOKEN"
```

### Payments Integration (M2M)

For payments service integration:

```bash
# Process payment event (M2M endpoint)
curl -X POST http://localhost:3000/api/v1/internal/payments/events \
  -H "Authorization: Bearer M2M_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_123",
    "type": "subscription.created",
    "userId": "USER_ID",
    "data": {
      "plan": "premium",
      "status": "active",
      "currentPeriodEnd": "2024-02-01T00:00:00Z",
      "provider": "stripe",
      "providerRef": "sub_123"
    }
  }'
```

## 🏗️ Architecture

### Folder Structure

```
bedtime-backend/
├── src/
│   ├── api/v1/
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middlewares/     # Auth, validation, caching, etc.
│   │   ├── routes/          # Route definitions
│   │   ├── serializers/     # Response formatting
│   │   └── validators/      # Zod input validation
│   ├── config/              # Environment configuration
│   ├── loaders/             # App initialization (DB, Redis, Express)
│   ├── models/              # Mongoose schemas
│   ├── repositories/        # Data access layer
│   ├── services/            # Business logic
│   ├── utils/               # Utilities (JWT, logger, etc.)
│   └── server.js            # Application entry point
├── scripts/                 # Database seeds, migrations
├── tests/                   # Unit and integration tests
├── docker-compose.yml       # Development environment
├── Dockerfile              # Production container
└── openapi.yaml            # API specification
```

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis with ioredis
- **Authentication**: Google OAuth + JWT
- **Validation**: Zod
- **Logging**: Pino
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI 3.0 + Swagger UI
- **Containerization**: Docker + Docker Compose

### Key Features

#### 🎯 Core API Features
- 🔐 **Google OAuth Authentication** with JWT access/refresh tokens
- 👶 **Kid Profile Management** with preferences and age-based content
- 📚 **Content Management** with search, filtering, and recommendations
- ❤️ **Favorites System** per kid profile
- 💳 **Subscription Management** with payments integration
- 🚀 **Production Ready** with health checks, metrics, and monitoring
- 📊 **Comprehensive Testing** with >80% coverage
- 🔄 **Rate Limiting** and security best practices
- 📖 **Auto-generated API Documentation**

#### 🌟 Admin Dashboard Features
- 📊 **Beautiful Analytics Dashboard** with real-time metrics and charts
- 📚 **Content Management Interface** with drag-and-drop file uploads
- 👥 **User Management System** with subscription monitoring
- 🎨 **Modern UI Design** built with React and Tailwind CSS
- 📱 **Fully Responsive** design for desktop, tablet, and mobile
- 🔍 **Advanced Search & Filtering** across all content and users
- 📈 **Performance Analytics** with engagement insights
- ⚙️ **System Administration** tools and settings

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server (requires MongoDB and Redis)
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Linting and formatting
npm run lint
npm run lint:fix
npm run format

# Database operations
npm run seed          # Seed sample content
npm run migrate up    # Run migrations
npm run migrate down  # Rollback last migration
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://mongo:27017/bedtime` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `JWT_ACCESS_SECRET` | JWT access token secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh token secret | Required |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Required |
| `CDN_BASE` | CDN base URL for assets | `https://cdn.example.com` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `PAYMENTS_BASE_URL` | Payments service URL | `http://payments-svc:4000/api/v1` |

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- auth.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should authenticate"
```

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker build -t bedtime-api .

# Run with production environment
docker run -d \
  --name bedtime-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGO_URI=mongodb://your-mongo-host:27017/bedtime \
  -e REDIS_URL=redis://your-redis-host:6379 \
  -e JWT_ACCESS_SECRET=your-secure-secret \
  -e GOOGLE_CLIENT_ID=your-google-client-id \
  bedtime-api
```

### Health Checks

The API provides several health check endpoints:

- `GET /healthz` - Overall health status
- `GET /readyz` - Readiness for traffic
- `GET /metrics` - Basic application metrics

### Monitoring

- **Structured Logging**: JSON logs with request IDs
- **Error Tracking**: Comprehensive error handling with stack traces
- **Performance Metrics**: Request duration, memory usage, etc.
- **Health Checks**: Database and cache connectivity

## 🔒 Security

- **Authentication**: Google OAuth with email verification
- **Authorization**: JWT with access/refresh token rotation
- **Rate Limiting**: Per-IP and per-user limits
- **Input Validation**: Zod schema validation
- **Security Headers**: Helmet.js protection
- **CORS**: Configurable origin allowlist
- **Secrets Management**: Environment-based configuration

## 📊 API Response Format

All API responses follow a consistent envelope format:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe"
    }
  },
  "error": [],
  "message": "Operation completed successfully"
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": ["VALIDATION_ERROR", "MISSING_FIELD"],
  "message": "Validation failed"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: http://localhost:3000/docs
- **Health Status**: http://localhost:3000/healthz
- **Issues**: Create an issue in the repository
- **Email**: support@bedtimestories.com

---

Built with ❤️ for better bedtime stories
