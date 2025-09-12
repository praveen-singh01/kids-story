# Kids Story - Complete API Collection (Updated) v3.0.0

## 🌟 Overview

This is the most comprehensive and up-to-date Postman collection for the Kids Story backend API. It includes all available endpoints with proper authentication, validation, and automatic variable management.

## 📁 Collection Features

- **Complete API Coverage**: All 60+ endpoints across 9 major sections
- **Automatic Variable Management**: IDs are automatically captured and reused
- **Bilingual Support**: English and Hindi content support
- **Authentication Handling**: Separate tokens for users and admins
- **Test Scripts**: Automatic validation and data extraction
- **Environment Ready**: Works with development and production environments

## 🚀 Quick Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `Kids-Story-Complete-API-Updated.postman_collection.json`

### 2. Set Base URL
Update the `base_url` variable:
- **Development**: `http://localhost:5000/api/v1`
- **Production**: `https://your-production-url.com/api/v1`

### 3. Authentication Flow
1. Run **Authentication → Register with Email** or **Login with Email**
2. The auth token will be automatically saved to `auth_token` variable
3. User ID will be automatically saved to `user_id` variable

## 📋 API Sections

### 🔐 Authentication (5 endpoints)
- Register with Email/Password
- Login with Email/Password  
- Google OAuth Login
- Email Verification
- Refresh Token

### 👤 User Management (4 endpoints)
- Get Current User Profile
- Update User Profile
- Get User Subscription
- Delete User Account

### 👶 Kid Profiles (5 endpoints)
- List Kid Profiles
- Create Kid Profile
- Get Kid Profile
- Update Kid Profile
- Delete Kid Profile

### 📚 Content Management (6 endpoints)
- List Content (with filtering)
- Search Content
- Get Featured Content
- Get Available Languages
- Get Content by Slug
- Get Content by Type

### 🏷️ Categories (3 endpoints)
- List Categories
- Get Category by Slug
- Get Subcategories

### 🎭 Avatars (2 endpoints)
- Get Available Avatars
- Get Specific Avatar

### 🔍 Explore (4 endpoints)
- Get Browse Categories
- Get Continue Playing Items
- Get Featured Collections
- Get Collection Content

### ❤️ Favorites (4 endpoints)
- Get User Favorites
- Add to Favorites
- Check Favorite Status
- Remove from Favorites

### 📊 Progress Tracking (4 endpoints)
- Update Progress
- Get Content Progress
- Get All Progress
- Reset Progress

### 💳 Subscriptions (5 endpoints)
- Get Available Plans
- Get My Subscription
- Create Subscription
- Update Subscription
- Cancel Subscription

### 💰 Payment (6 endpoints)
- Create Order
- Create Payment Subscription
- Get User Orders
- Get User Subscriptions
- Verify Payment Success
- Payment Callback (Microservice)

### 🔧 Admin Operations (5 endpoints)
- Admin Health Check
- Admin - List Users
- Admin - Create User
- Admin - List Content
- Admin - Create Content

### 🏥 Health & System (3 endpoints)
- API Root
- Health Check
- Detailed Health Check

## 🔧 Collection Variables

The collection automatically manages these variables:

| Variable | Description | Auto-populated |
|----------|-------------|----------------|
| `base_url` | API base URL | Manual |
| `auth_token` | User authentication token | ✅ |
| `admin_token` | Admin authentication token | Manual |
| `user_id` | Current user ID | ✅ |
| `kid_id` | Kid profile ID | ✅ |
| `content_id` | Content item ID | ✅ |
| `content_slug` | Content slug | ✅ |
| `category_id` | Category ID | ✅ |
| `favorite_id` | Favorite item ID | ✅ |
| `subscription_id` | Subscription ID | ✅ |
| `order_id` | Payment order ID | ✅ |
| `plan_id_trial` | Trial plan ID | Static |
| `plan_id_monthly` | Monthly plan ID | Static |
| `plan_id_yearly` | Yearly plan ID | Static |

## 🎯 Testing Workflow

### 1. Authentication Setup
```
1. Run "Register with Email" or "Login with Email"
2. Token and User ID are automatically saved
3. All subsequent requests use the saved token
```

### 2. Content Discovery Flow
```
1. List Content → Get content IDs and slugs
2. Get Content by Slug → View detailed content
3. Add to Favorites → Save liked content
4. Update Progress → Track listening progress
```

### 3. Kid Profile Management
```
1. Get Available Avatars → Choose avatar
2. Create Kid Profile → Set up child profile
3. List Kid Profiles → View all profiles
```

### 4. Subscription Flow
```
1. Get Available Plans → View subscription options
2. Create Subscription → Start subscription process
3. Get My Subscription → Check subscription status
```

### 5. Admin Operations
```
1. Set admin_token variable manually
2. Run admin endpoints with admin authentication
3. Manage users and content through admin APIs
```

## 🌐 Bilingual Support

All content endpoints support language parameters:
- **English**: `language=en` (default)
- **Hindi**: `language=hi`

Example requests:
```
GET /content?language=hi&type=story
GET /content/search?query=कहानी&language=hi
GET /content/featured?language=hi
```

## 📝 Sample Request Bodies

### User Registration
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "phone": "+919999999999"
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
  "contentId": "{{content_id}}",
  "contentType": "story"
}
```

### Update Progress
```json
{
  "contentId": "{{content_id}}",
  "progress": 120,
  "total": 300,
  "completed": false
}
```

### Create Subscription
```json
{
  "planId": "{{plan_id_trial}}",
  "paymentContext": {
    "userType": "premium",
    "source": "mobile_app",
    "metadata": {
      "userPhone": "+919999999999"
    }
  }
}
```

## 🚨 Important Notes

1. **Authentication**: Most endpoints require Bearer token authentication
2. **Plan IDs**: Update plan IDs to match your Razorpay configuration
3. **Admin Token**: Set `admin_token` manually for admin operations
4. **Base URL**: Update `base_url` for your environment
5. **Auto Variables**: IDs are automatically captured from responses

## 🐛 Troubleshooting

### Common Issues
- **401 Unauthorized**: Check if `auth_token` is set and valid
- **404 Not Found**: Verify endpoint URLs and required IDs
- **400 Bad Request**: Check request body format and required fields

### Debug Tips
1. Check Postman Console for request/response details
2. Verify collection variables are set correctly
3. Ensure server is running on correct port
4. Check MongoDB connection status

## 📞 Support

For issues or questions:
- Check server logs in `backend/logs/`
- Review API documentation in route files
- Test individual endpoints to isolate issues
- Verify database connection and data integrity

---

**Version**: 3.0.0  
**Last Updated**: December 2024  
**Total Endpoints**: 60+  
**Sections**: 12
