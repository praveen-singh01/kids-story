# Kids Story Payment API - Postman Collection

This directory contains comprehensive Postman collections and environments for testing the Kids Story Payment API integration.

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
- `POST /auth/google` - Google OAuth login
- `GET /users/me` - Get current user details

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
- `GET /` - API root endpoint

## 🔧 Environment Variables

### Development Environment
- `base_url`: `http://localhost:3000/api/v1`
- `auth_token`: Your JWT access token
- `user_id`: Current user's ID
- `razorpay_monthly_plan`: `plan_RAeTVEtz6dFtPY`
- `razorpay_yearly_plan`: `plan_RAeTumFCrDrT4X`

### Production Environment
- `base_url`: `https://milo.netaapp.in/api/v1`
- All other variables same as development

## 📝 Testing Workflow

### 1. Authentication Flow
```
1. Google OAuth Login → Get access token
2. Get Current User → Get user ID
3. Set both in environment variables
```

### 2. Order Creation Flow
```
1. Create Order → Get order ID and Razorpay order ID
2. [Frontend handles Razorpay payment]
3. Verify Payment Success → Confirm payment
4. Get User Orders → View order history
```

### 3. Subscription Flow
```
1. Get Subscription Plans → View available plans
2. Create Subscription → Get subscription ID and payment URL
3. [User completes payment via Razorpay]
4. Payment Callback → Microservice notifies status
5. Get My Subscription → Check subscription status
```

## 🎯 Sample Request Bodies

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
