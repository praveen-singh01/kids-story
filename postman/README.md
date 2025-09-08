# Kids Story Complete API - Postman Collection (Bilingual Support)

This directory contains comprehensive Postman collections and environments for testing the complete Kids Story API, including all endpoints for authentication, **bilingual content management**, user profiles, payment integration, and more.

## 🌟 NEW: Bilingual Content Support

The API now supports **English** and **Hindi** content with language-specific:
- Titles and descriptions
- Audio files
- Images and thumbnails
- Metadata and summaries

## 📁 Files Included

- `Kids-Story-Payment-API.postman_collection.json` - Complete API collection
- `Kids-Story-Development.postman_environment.json` - Development environment variables
- `Kids-Story-Production.postman_environment.json` - Production environment variables

## 🚀 Quick Setup

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button
3. Import all three files:
   - `Kids-Story-Payment-API.postman_collection.json`
   - `Kids-Story-Development.postman_environment.json`
   - `Kids-Story-Production.postman_environment.json`

### 2. Select Environment

- For local testing: Select **Kids Story - Development**
- For production testing: Select **Kids Story - Production**

### 3. Authentication Setup

1. **Get Google ID Token**: Use Google OAuth to get an ID token
2. **Login via API**: 
   - Run `Authentication > Google OAuth Login`
   - Copy the `accessToken` from response
   - Set it as `auth_token` in your environment variables
3. **Get User ID**:
   - Run `Authentication > Get Current User`
   - Copy the user `_id` from response
   - Set it as `user_id` in your environment variables

## 📋 API Endpoints Overview

### 🔐 Authentication
- `POST /auth/register` - Register with email/password
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token

### 👤 User Management
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `DELETE /users/me` - Delete user account

### 👶 Kid Profiles
- `GET /kids` - List kid profiles
- `POST /kids` - Create kid profile
- `GET /kids/:id` - Get specific kid profile
- `PATCH /kids/:id` - Update kid profile
- `DELETE /kids/:id` - Delete kid profile

### 📚 Content Management (Bilingual Support)
- `GET /content` - List content with filtering and language support
- `GET /content/search` - Search content in specific language
- `GET /content/featured` - Get featured content with language support
- `GET /content/:slug` - Get content by slug in requested language
- `GET /content/type/:type` - Get content by type with language filtering
- `GET /content/languages` - Get available languages ⭐ NEW

#### Language Parameters
All content endpoints now support the `language` parameter:
- **English**: `language=en` (default)
- **Hindi**: `language=hi`

#### Bilingual Response Format
```json
{
  "success": true,
  "data": {
    "title": "बुद्ध और अंगुलिमाल",
    "description": "करुणा और परिवर्तन की कहानी...",
    "audioUrl": "/assets/ElevenLabs_buddha_and_angulimala.mp3",
    "imageUrl": "/assets/Hindi.png",
    "availableLanguages": ["en", "hi"],
    "requestedLanguage": "hi"
  }
}
```

### 🎭 Avatars
- `GET /avatars` - Get available avatars

### 🔍 Explore
- `GET /explore/categories` - Get browse categories
- `GET /explore/continue` - Get continue playing items
- `GET /explore/collections` - Get featured collections
- `GET /explore/collections/:id` - Get collection content

### ❤️ Favorites
- `GET /favorites` - Get user's favorites
- `POST /favorites` - Add to favorites
- `DELETE /favorites/:id` - Remove from favorites
- `GET /favorites/check/:contentId` - Check favorite status

### 📊 Progress Tracking
- `POST /progress` - Update progress
- `GET /progress/:contentId` - Get content progress
- `GET /progress` - Get all progress
- `DELETE /progress/:contentId` - Reset progress

### 💳 Payment Orders
- `POST /payment/order` - Create a new payment order
- `GET /payment/orders` - Get user's order history

### 📅 Payment Subscriptions
- `POST /payment/subscription` - Create a new subscription
- `GET /payment/subscriptions` - Get user's subscriptions

### ✅ Payment Verification
- `POST /payment/verify-success` - Verify payment success with Razorpay

### 🔄 Payment Callbacks
- `POST /payment/callback` - Handle payment status callbacks (for microservice)

### 📊 Subscription Management
- `GET /subscriptions/me` - Get current user's subscription
- `POST /subscriptions` - Create subscription (legacy endpoint)
- `PATCH /subscriptions/me` - Update subscription
- `POST /subscriptions/me/cancel` - Cancel subscription
- `GET /subscriptions/plans` - Get available plans

### 🏥 Health & Utility
- `GET /health` - API health check
- `GET /health/detailed` - Detailed health check
- `GET /` - API root endpoint

## 🔧 Environment Variables

### Development Environment
- `base_url`: `http://localhost:5000/api/v1`
- `auth_token`: Your JWT access token
- `user_id`: Current user's ID
- `kid_id`: Kid profile ID for testing
- `content_id`: Content ID for testing
- `favorite_id`: Favorite ID for testing
- `content_slug`: Content slug for testing
- `razorpay_monthly_plan`: `plan_RAeTVEtz6dFtPY`
- `razorpay_yearly_plan`: `plan_RAeTumFCrDrT4X`

### Production Environment
- `base_url`: `https://milo.netaapp.in/api/v1`
- All other variables same as development

## 📝 Testing Workflow

### 1. Authentication Flow
```
1. Register/Login → Get access token
2. Get Current User → Get user ID
3. Set both in environment variables
```

### 2. Content Discovery Flow (Bilingual)
```
1. Get Available Languages → Check supported languages
2. Get Featured Content → Browse featured items (with language)
3. Search Content → Find specific content (with language)
4. Get Content by Slug → View detailed content (with language)
5. Add to Favorites → Save liked content
6. Update Progress → Track listening progress
```

#### Bilingual Testing Examples
```
English: GET /content?language=en&type=story
Hindi:   GET /content?language=hi&type=story
Search:  GET /content/search?query=बुद्ध&language=hi
Slug:    GET /content/buddha-and-angulimala?language=hi
```

### 3. Kid Profile Management Flow
```
1. Get Available Avatars → Choose avatar
2. Create Kid Profile → Set up child profile
3. List Kid Profiles → View all profiles
4. Update Kid Profile → Modify profile details
```

### 4. Order Creation Flow
```
1. Create Order → Get order ID and Razorpay order ID
2. [Frontend handles Razorpay payment]
3. Verify Payment Success → Confirm payment
4. Get User Orders → View order history
```

### 5. Subscription Flow
```
1. Get Subscription Plans → View available plans
2. Create Subscription → Get subscription ID and payment URL
3. [User completes payment via Razorpay]
4. Payment Callback → Microservice notifies status
5. Get My Subscription → Check subscription status
```

## 🎯 Sample Request Bodies

### User Registration
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

### Create Kid Profile
```json
{
  "name": "Emma",
  "ageRange": "6-8",
  "avatarKey": "avatar_girl_1"
}
```

### Add to Favorites
```json
{
  "contentId": "content_123",
  "contentType": "story"
}
```

### Update Progress
```json
{
  "contentId": "content_123",
  "progress": 120,
  "total": 300,
  "completed": false
}
```

### Create Order
```json
{
  "amount": 9900,
  "currency": "INR",
  "paymentContext": {
    "planType": "monthly",
    "description": "Kids Story Monthly Plan"
  }
}
```

### Create Subscription
```json
{
  "planId": "plan_RAeTVEtz6dFtPY",
  "paymentContext": {
    "userType": "premium",
    "source": "mobile_app"
  }
}
```

### Payment Verification
```json
{
  "razorpay_order_id": "order_razorpay_123",
  "razorpay_payment_id": "pay_razorpay_123",
  "razorpay_signature": "signature_hash_here"
}
```

## 🔍 Response Examples

### Successful Order Creation
```json
{
  "success": true,
  "data": {
    "orderId": "order_123",
    "amount": 9900,
    "currency": "INR",
    "razorpayOrderId": "order_razorpay_123",
    "status": "created"
  },
  "message": "Order created successfully"
}
```

### Subscription Status
```json
{
  "success": true,
  "data": {
    "plan": "premium",
    "status": "active",
    "currentPeriodEnd": "2024-02-01T00:00:00.000Z",
    "provider": "razorpay",
    "paymentDetails": {
      "subscriptionId": "sub_123",
      "planId": "plan_RAeTVEtz6dFtPY",
      "status": "active"
    }
  }
}
```

## 🚨 Important Notes

1. **Authentication Required**: Most endpoints require Bearer token authentication
2. **Plan IDs**: Use the actual Razorpay plan IDs from your environment
3. **Callback Endpoint**: The `/payment/callback` endpoint is called by the payment microservice
4. **Amount Format**: Amounts are in paise (₹99 = 9900 paise)
5. **Environment**: Always select the correct environment before testing

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if `auth_token` is set and valid
2. **400 Bad Request**: Verify request body format and required fields
3. **404 Not Found**: Ensure correct endpoint URL and method
4. **500 Internal Server Error**: Check server logs for detailed error

### Debug Tips

1. Check Postman Console for detailed request/response logs
2. Verify environment variables are set correctly
3. Ensure server is running on correct port
4. Check MongoDB connection status

## 📞 Support

For API issues or questions:
- Check server logs in `backend/logs/`
- Review the integration documentation in `backend/micro-service.md`
- Test individual endpoints to isolate issues
