# 📚 Bedtime Stories API - Postman Collection

This comprehensive Postman collection contains all the API endpoints for the Bedtime Stories backend service. It includes authentication, content management, user profiles, favorites, subscriptions, and admin functionality.

## 🚀 Quick Start

### 1. Import the Collection
1. Open Postman
2. Click "Import" button
3. Select the `Bedtime_Stories_API.postman_collection.json` file
4. The collection will be imported with all endpoints organized by category

### 2. Set Up Environment Variables
The collection uses the following variables that you can set in Postman:

| Variable | Description | Default Value |
|----------|-------------|---------------|
| `baseUrl` | API base URL | `http://localhost:3000/api/v1` |
| `accessToken` | JWT access token | Auto-set after login |
| `refreshToken` | JWT refresh token | Auto-set after login |
| `userId` | Current user ID | Auto-set after login |
| `kidId` | Kid profile ID | Auto-set after creating kid |
| `contentId` | Content item ID | Auto-set when viewing content |

### 3. Authentication Flow
1. **Register** or **Login** to get tokens
2. Tokens are automatically saved to collection variables
3. All authenticated endpoints use the `accessToken` automatically

## 📁 Collection Structure

### 🔐 Authentication
- **Register User** - Create new user account
- **Login User** - Authenticate and get tokens
- **Google Auth** - Login with Google OAuth
- **Refresh Token** - Get new access token
- **Get Profile** - Get current user profile
- **Update Profile** - Update user information
- **Logout** - Invalidate refresh token
- **Verify Email** - Verify email address
- **Forgot Password** - Request password reset
- **Reset Password** - Reset password with token

### 👶 Kids Management
- **Get All Kids** - List all kid profiles for user
- **Create Kid Profile** - Add new kid profile
- **Get Kid by ID** - Get specific kid details
- **Update Kid Profile** - Modify kid information
- **Delete Kid Profile** - Remove kid profile
- **Get Kid Preferences** - Get kid's preferences
- **Update Kid Preferences** - Modify kid's preferences

### 🔍 Explore & Discovery
- **Get Content Categories** - List all content categories
- **Browse Content List** - Browse content with filters
- **Search Content** - Search content by query

### 📚 Content
- **Get Content by Slug** - Get specific content details
- **Increment Content Popularity** - Track content plays
- **Get Content Categories** - Alternative categories endpoint

### 🏠 Home
- **Get Home Content** - Get personalized home content

### ❤️ Favorites
- **Get Favorites** - List user's favorite content
- **Add to Favorites** - Add content to favorites
- **Bulk Add Favorites** - Add multiple items to favorites
- **Check if Favorited** - Check if content is favorited
- **Remove from Favorites** - Remove from favorites
- **Get Favorite Stats** - Get favorites statistics
- **Remove All Kid Favorites** - Clear all favorites for a kid

### 💳 Subscription
- **Get Current Subscription** - Get user's subscription status
- **Create Checkout Session** - Create payment session
- **Cancel Subscription** - Cancel active subscription

### 🏥 Health & Monitoring
- **Health Check** - Basic health endpoint
- **Readiness Check** - Readiness probe
- **Get Metrics** - Application metrics

### 🔧 Internal (M2M)
- **Process Payment Event** - Handle payment webhooks

### 👑 Admin (Requires Admin Role)
#### Content Management
- **Get Content Stats** - Content statistics
- **Get Admin Content List** - Admin content listing
- **Create Content** - Add new content
- **Get Content by ID** - Get content details
- **Update Content** - Modify content
- **Delete Content** - Remove content

#### User Management
- **Get Users List** - List all users
- **Get User by ID** - Get user details
- **Update User** - Modify user
- **Delete User** - Remove user

#### Analytics & Stats
- **Get Overview Stats** - System overview
- **Get User Stats** - User analytics
- **Get Engagement Stats** - Engagement metrics
- **Get Subscription Stats** - Subscription analytics
- **Get Most Favorited Content** - Popular content

#### System Management
- **Get System Health** - System status
- **Clear Cache** - Clear application cache

## 🔧 Usage Tips

### Authentication
1. Start with **Register User** or **Login User**
2. The collection automatically saves tokens
3. All subsequent requests use the saved token

### Testing Flow
1. **Register/Login** → Get authenticated
2. **Create Kid Profile** → Set up kid for testing
3. **Browse Content** → Explore available content
4. **Add to Favorites** → Test favorites functionality
5. **Get Home Content** → See personalized content

### Query Parameters
Many endpoints support query parameters for filtering:
- `type`: Content type (story, music, meditation, affirmation)
- `ageRange`: Age range (3-5, 6-8, 9-12)
- `limit`: Number of results (1-50)
- `offset`: Pagination offset
- `sort`: Sort field (popular, new, duration)
- `isFeatured`: Filter featured content

### Error Handling
The API returns consistent error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": ["Email is required"]
  }
}
```

## 🌐 Environment Setup

### Local Development
```
baseUrl: http://localhost:3000/api/v1
```

### Staging
```
baseUrl: https://staging-api.bedtimestories.com/api/v1
```

### Production
```
baseUrl: https://api.bedtimestories.com/api/v1
```

## 📝 Notes

- All timestamps are in ISO 8601 format
- File uploads use multipart/form-data
- Rate limiting: 100 requests per minute per IP
- Admin endpoints require `admin` role
- Some endpoints are cached for performance
- Redis caching is temporarily disabled in development

## 🔒 Security

- All authenticated endpoints require valid JWT token
- Tokens expire after 15 minutes (access) / 30 days (refresh)
- Admin endpoints require additional role verification
- Input validation on all endpoints
- Rate limiting and request size limits applied

## 🐛 Troubleshooting

### Common Issues
1. **401 Unauthorized**: Token expired, use refresh token
2. **403 Forbidden**: Insufficient permissions
3. **429 Too Many Requests**: Rate limit exceeded
4. **500 Internal Server Error**: Check server logs

### Support
For API issues, check the server logs or contact the development team.
