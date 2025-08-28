# 📚 Kids Story API - Postman Collection Guide

## 🚀 Quick Setup

### 1. Import Collection
1. Open Postman
2. Click **Import** 
3. Select `Kids-Story-API-Production.postman_collection.json`
4. Collection will be imported with all endpoints

### 2. Environment Variables
The collection uses these variables (automatically set):
- `base_url`: `https://milo.netaapp.in/api/v1`
- `access_token`: Auto-populated after login
- `refresh_token`: Auto-populated after login

## 🔐 Authentication Flow

### Step 1: Login
1. Go to **🔐 Authentication** → **Login (Email/Password)**
2. Use credentials:
   ```json
   {
     "email": "admin@milo.netaapp.in",
     "password": "MiloAdmin2024!"
   }
   ```
3. Send request - tokens will be automatically saved

### Step 2: Use Protected Endpoints
All admin and user endpoints will now use the saved `access_token` automatically.

## 📋 Endpoint Categories

### ✅ **Working Endpoints (Recommended)**

#### 📚 Content & Categories
- **Get Categories**: `GET /content/categories` ✅ **Use This One**
- **Get Content by Slug**: `GET /content/{slug}` ✅
- **Increment Popularity**: `POST /content/{slug}/play` ✅

#### 🔐 Authentication  
- **Login**: `POST /auth/login` ✅
- **Google Auth**: `POST /auth/google` ✅
- **Register**: `POST /auth/register` ✅
- **Refresh Token**: `POST /auth/refresh` ✅

#### 🏥 System
- **Health Check**: `GET /healthz` ✅
- **API Docs**: `GET /docs` ✅

### ⚠️ **Cached Endpoints (May Return Empty)**

#### 🔍 Explore & Discovery
- **Get Categories**: `GET /explore/categories` ⚠️ *Cached - may be empty*
- **Get Content List**: `GET /explore/list` ⚠️ *Cached - may be empty*
- **Search Content**: `GET /explore/search` ⚠️ *May be cached*

> **Note**: These endpoints are cached and may return empty data until the production server is restarted.

### 🔒 **Protected Endpoints (Require Login)**

#### 👶 Kids Management
- **Get User's Kids**: `GET /kids`
- **Create Kid Profile**: `POST /kids`
- **Get Kid by ID**: `GET /kids/{id}`
- **Update Kid**: `PATCH /kids/{id}`

#### ❤️ Favorites
- **Get Favorites**: `GET /favorites`
- **Add to Favorites**: `POST /favorites`
- **Remove from Favorites**: `DELETE /favorites/{contentId}`

#### 🏠 Home & Personalization
- **Get Home Content**: `GET /home`

#### 💳 Payments & Subscriptions
- **Get Payment Status**: `GET /payment/status` ✅
- **Get Subscription Plans**: `GET /payment/plans` ✅
- **Create Payment Order**: `POST /payment/order` ✅
- **Create Subscription**: `POST /payment/subscription` ✅
- **Verify Payment**: `POST /payment/verify` ✅
- **Get User Orders**: `GET /payment/orders` ✅
- **Get User Subscriptions**: `GET /payment/subscriptions` ✅

#### 📋 Subscription Management
- **Get Current Subscription**: `GET /subscription` ✅
- **Create Checkout Session**: `POST /subscription/checkout` ✅
- **Cancel Subscription**: `POST /subscription/cancel` ✅

### 🔧 **Admin Endpoints (Require Admin Login)**

#### 📁 Category Management
- **Get All Categories**: `GET /admin/categories`
- **Create Category**: `POST /admin/categories`
- **Update Category**: `PUT /admin/categories/{id}`
- **Delete Category**: `DELETE /admin/categories/{id}`

#### 📝 Content Management
- **Get All Content**: `GET /admin/content`
- **Create Content**: `POST /admin/content`
- **Update Content**: `PUT /admin/content/{id}`
- **Delete Content**: `DELETE /admin/content/{id}`

#### 📊 Analytics & Stats
- **Overview Stats**: `GET /admin/stats/overview`
- **Content Stats**: `GET /admin/stats/content`
- **User Stats**: `GET /admin/stats/users`

#### 💳 Subscription Analytics (Admin)
- **Get Subscription Statistics**: `GET /admin/subscriptions/stats`
- **Get All Subscriptions**: `GET /admin/subscriptions`
- **Get All Orders**: `GET /admin/orders`

## 🎯 **Quick Test Sequence**

### 1. Basic API Test
```
1. Health Check → Should return healthy status
2. Get Categories (Working) → Should return ["affirmation","meditation","music","story"]
3. Get Content by Slug → Should return full content data
```

### 2. Authentication Test
```
1. Login → Should return access_token and refresh_token
2. Get Home Content → Should work with token
3. Refresh Token → Should return new tokens
```

### 3. Admin Test (After Login)
```
1. Get All Categories (Admin) → Should return detailed category data
2. Get All Content (Admin) → Should return all content with admin details
3. Overview Stats → Should return system statistics
```

### 4. Payment & Subscription Test
```
1. Get Payment Status → Should show if payment service is enabled
2. Get Subscription Plans → Should return available plans (trial, monthly, yearly)
3. Create Payment Order → Should create Razorpay order
4. Get Current Subscription → Should return user's subscription status
```

## 🔧 **Troubleshooting**

### Empty Responses
If you get empty responses from `/explore/*` endpoints:
1. Use `/content/categories` instead of `/explore/categories`
2. The data is there, just cached differently

### Authentication Errors
1. Make sure you've logged in first
2. Check that `access_token` variable is set
3. Try refreshing the token if expired

### Admin Access Denied
1. Ensure you're using admin credentials: `admin@milo.netaapp.in`
2. Check that the user has admin role in the response

## 📝 **Sample Responses**

### Categories (Working Endpoint)
```json
{
  "success": true,
  "data": ["affirmation", "meditation", "music", "story"],
  "error": [],
  "message": "Categories retrieved successfully"
}
```

### Content by Slug
```json
{
  "success": true,
  "data": {
    "_id": "68aff0a88e6b235231e217a2",
    "type": "story",
    "title": "The Sleepy Forest",
    "slug": "the-sleepy-forest",
    "durationSec": 480,
    "ageRange": "3-5",
    "tags": ["folk_tales", "calming"],
    "audioUrl": "https://example.com/audio/stories/sleepy-forest.mp3",
    "imageUrl": "https://example.com/images/stories/sleepy-forest.jpg",
    "isFeatured": true,
    "popularityScore": 85
  }
}
```

### Subscription Plans
```json
{
  "success": true,
  "data": {
    "trial": {
      "planId": "plan_trial",
      "name": "Free Trial",
      "amount": 0,
      "currency": "INR",
      "interval": "month",
      "intervalCount": 1,
      "trialPeriodDays": 7
    },
    "monthly": {
      "planId": "plan_monthly",
      "name": "Monthly Premium",
      "amount": 9900,
      "currency": "INR",
      "interval": "month",
      "intervalCount": 1
    },
    "yearly": {
      "planId": "plan_yearly",
      "name": "Yearly Premium",
      "amount": 99900,
      "currency": "INR",
      "interval": "year",
      "intervalCount": 1
    }
  }
}
```

### Payment Order Creation
```json
{
  "success": true,
  "data": {
    "orderId": "order_xyz123",
    "razorpayOrderId": "order_MBhYZ1a2b3c4d5",
    "amount": 9900,
    "currency": "INR",
    "status": "created",
    "razorpayKey": "rzp_test_xxxxxxxxxx"
  }
}
```

### Current Subscription
```json
{
  "success": true,
  "data": {
    "_id": "subscription_id",
    "userId": "user_id",
    "planType": "monthly",
    "planName": "Monthly Premium",
    "status": "active",
    "amount": 9900,
    "currency": "INR",
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-02-01T00:00:00.000Z",
    "nextBillingDate": "2024-02-01T00:00:00.000Z",
    "autoRenewal": true
  }
}
```

## 🌟 **Pro Tips**

1. **Use the working endpoints** (`/content/*`) for reliable data
2. **Login first** to test protected endpoints
3. **Check the Tests tab** in requests for automatic token handling
4. **Use environment variables** for easy switching between environments
5. **Save frequently used requests** to your favorites

---

**Base URL**: `https://milo.netaapp.in/api/v1`  
**Admin Credentials**: `admin@milo.netaapp.in` / `MiloAdmin2024!`  
**API Documentation**: `https://milo.netaapp.in/docs`
