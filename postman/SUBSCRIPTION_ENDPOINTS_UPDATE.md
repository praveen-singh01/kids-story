# Subscription Endpoints Update - Postman Collection

## Overview
Added comprehensive subscription management endpoints to the main Postman collection (`Kids-Story-Complete-API.postman_collection.json`) with automatic subscription ID testing and validation.

## Changes Made

### 1. Collection Variables Added
- `subscription_id`: Stores subscription ID for dynamic usage across requests
- `plan_id`: Default plan ID set to "plan_kids_story_trial" for testing

### 2. New Subscription Management Section
Added complete subscription management with three main subsections:

#### 📋 User Subscription Operations
- **Get Available Plans**: Retrieve all subscription plans
- **Get My Subscription**: Get current user's subscription details
- **Create Subscription**: Create new subscription with automatic ID capture
- **Update Subscription**: Update existing subscription plan
- **Cancel Subscription**: Cancel user's active subscription

#### 💰 Payment Operations
- **Create Payment Subscription**: Direct payment service subscription creation
- **Get User Subscriptions**: Retrieve user's payment subscriptions with pagination

### 3. Admin Subscription Management Section
Added comprehensive admin subscription management:
- **List All Subscriptions**: Admin view of all subscriptions with filtering
- **Get Subscription Details**: Detailed view of specific subscription
- **Cancel Subscription (Admin)**: Admin cancellation of user subscriptions
- **Get Revenue Analytics**: Revenue analytics with time range filtering
- **Get Subscription Analytics**: Subscription-specific analytics

## Automatic Testing Features

### Subscription ID Capture
All subscription creation endpoints include test scripts that automatically:
1. **Capture Subscription ID**: Saves `subscriptionId` to collection variables
2. **Capture Razorpay ID**: Logs `razorpaySubscriptionId` for payment tracking
3. **Capture Payment URL**: Logs `shortUrl` for payment completion
4. **Validate Response**: Ensures proper response structure

### Test Scripts Added

#### Create Subscription Test Script
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    if (response.data.subscriptionId) {
        pm.collectionVariables.set('subscription_id', response.data.subscriptionId);
        console.log('Subscription ID saved:', response.data.subscriptionId);
    }
    if (response.data.razorpaySubscriptionId) {
        console.log('Razorpay Subscription ID:', response.data.razorpaySubscriptionId);
    }
    if (response.data.shortUrl) {
        console.log('Payment URL:', response.data.shortUrl);
    }
}
```

#### Admin Subscription List Test Script
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data.subscriptions && response.data.subscriptions.length > 0) {
        const firstSub = response.data.subscriptions[0];
        if (firstSub.id) {
            pm.collectionVariables.set('subscription_id', firstSub.id);
            console.log('Admin Subscription ID saved:', firstSub.id);
        }
    }
}
```

## API Endpoints Covered

### User Subscription Endpoints
- `GET /subscriptions/plans` - Available subscription plans
- `GET /subscriptions/me` - Current user subscription
- `POST /subscriptions` - Create subscription
- `PATCH /subscriptions/me` - Update subscription
- `POST /subscriptions/me/cancel` - Cancel subscription

### Payment Service Endpoints
- `POST /payment/subscription` - Create payment subscription
- `GET /payment/subscriptions` - Get user subscriptions

### Admin Subscription Endpoints
- `GET /admin/payment/subscriptions` - List all subscriptions
- `GET /admin/payment/subscriptions/:id` - Get subscription details
- `POST /admin/payment/subscriptions/:id/cancel` - Cancel subscription
- `GET /admin/payment/analytics/revenue` - Revenue analytics
- `GET /admin/payment/analytics/subscriptions` - Subscription analytics

## Query Parameters

### User Subscriptions
- `page`: Pagination page number
- `limit`: Number of subscriptions per page

### Admin Subscriptions
- `page`: Pagination page number
- `limit`: Number of subscriptions per page
- `status`: Filter by subscription status (active, inactive, cancelled)
- `plan`: Filter by subscription plan (free, premium)

### Analytics
- `timeRange`: Time range for analytics (7d, 30d, 90d, 1y)
- `groupBy`: Group results by (day, week, month)

## Request Bodies

### Create Subscription
```json
{
  "planId": "{{plan_id}}",
  "paymentContext": {
    "source": "mobile_app",
    "userAgent": "Kids Story App v1.0"
  }
}
```

### Update Subscription
```json
{
  "planId": "plan_kids_story_monthly"
}
```

## Testing Workflow

### 1. Authentication Setup
1. Run "Admin Login" to get admin token
2. Run "User Login" to get user token

### 2. Subscription Testing
1. **Get Available Plans**: Verify plan structure and pricing
2. **Create Subscription**: Test subscription creation and ID capture
3. **Get My Subscription**: Verify subscription was created
4. **Update Subscription**: Test plan changes
5. **Cancel Subscription**: Test cancellation flow

### 3. Payment Testing
1. **Create Payment Subscription**: Test direct payment service
2. **Get User Subscriptions**: Verify payment subscription list

### 4. Admin Testing
1. **List All Subscriptions**: Test admin subscription overview
2. **Get Subscription Details**: Test detailed subscription view
3. **Cancel Subscription (Admin)**: Test admin cancellation
4. **Analytics**: Test revenue and subscription analytics

## Validation Points

### Subscription Creation Validation
- ✅ Subscription ID is generated and captured
- ✅ Razorpay subscription ID is returned
- ✅ Payment URL is provided for completion
- ✅ Plan ID matches request
- ✅ Status is set correctly

### Admin Validation
- ✅ Subscription list includes pagination
- ✅ Filtering by status and plan works
- ✅ Subscription details include user information
- ✅ Analytics return proper time-based data

## Collection Structure Updated
```
🔐 Authentication
📚 Content Management
🏷️ Category Management
🔍 Explore & Discovery
👥 User Management
💳 Subscription Management (NEW)
  📋 User Subscription Operations
  💰 Payment Operations
🔍 Content Filtering & Search
📊 Analytics & System
🔧 Admin Subscription Management (NEW)
```

## Version Update
- Updated collection version from 2.1.0 to 2.2.0
- Enhanced description to include subscription and payment functionality

## Error Handling
All subscription endpoints include proper error handling for:
- Invalid plan IDs
- Existing active subscriptions
- Payment service failures
- Authentication errors
- Validation errors

The collection now provides comprehensive testing coverage for the entire subscription lifecycle from plan selection to cancellation, with automatic ID capture and validation.
