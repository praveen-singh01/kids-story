# Suno Stories App (com.sunostories.app) - Payment Microservice Integration Guide

## 🚀 Overview

This guide provides comprehensive instructions for integrating the Suno Stories app (`com.sunostories.app`) with the Payment Microservice. The integration follows the same multi-tenant architecture used by other apps in the system.

## 📱 App Configuration

### Package ID
```
com.sunostories.app
```

### Backend Name
```
backend-c-kids-story
```

## 🔧 Payment Microservice Configuration

### Environment Variables Required

Add these to your payment microservice `.env` file:

```bash
# JWT Secret for Kids Story Backend
JWT_SECRET_BACKEND_C=your_secure_jwt_secret_minimum_32_characters

# Callback URL for Kids Story App
CALLBACK_URL_COM_SUNOSTORIES_APP=https://milo.netaapp.in/api/v1/payment/callback
```

### Dynamic App Configuration (Recommended)

Use the admin API to register the app dynamically:

```bash
curl -X POST https://payments.gumbotech.in/api/config/apps \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: YOUR_ADMIN_API_KEY" \
  -d '{
    "packageId": "com.sunostories.app",
    "jwtSecret": "your_secure_jwt_secret_minimum_32_characters",
    "callbackUrl": "https://milo.netaapp.in/api/v1/payment/callback",
    "backendName": "backend-c-kids-story",
    "description": "Kids Story App - Educational stories and content for children",
    "contactEmail": "tech@kidsstory.com",
    "isActive": true,
    "allowedOrigins": ["https://kidsstory.com", "https://app.kidsstory.com"],
    "rateLimit": {
      "windowMs": 900000,
      "maxRequests": 100
    }
  }'
```

## 🏗️ Kids Story Backend Requirements

### 1. Environment Configuration

Create/update your `.env` file:

```bash
# Payment Microservice Configuration
USE_PAYMENT_MICROSERVICE=true
PAYMENT_MICROSERVICE_URL=https://payments.gumbotech.in
PAYMENT_JWT_SECRET=your_secure_jwt_secret_minimum_32_characters
PAYMENT_PACKAGE_ID=com.sunostories.app

# Razorpay Plan IDs (you'll need to create these in Razorpay dashboard)
RAZORPAY_TRIAL_PLAN_ID=plan_kids_story_trial
RAZORPAY_MONTHLY_PLAN_ID=plan_kids_story_monthly
RAZORPAY_YEARLY_PLAN_ID=plan_kids_story_yearly

# Callback URL (your backend endpoint)
PAYMENT_CALLBACK_URL=https://milo.netaapp.in/api/payment/callback
```

### 2. JWT Token Generation

Your backend needs to generate JWT tokens for API calls:

```javascript
const jwt = require('jsonwebtoken');

function generatePaymentToken(userId) {
  const payload = {
    userId: userId,
    appId: 'com.sunostories.app',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
  };
  
  return jwt.sign(payload, process.env.PAYMENT_JWT_SECRET);
}
```

### 3. Payment Service Client

Create a payment service client:

```javascript
const axios = require('axios');

class PaymentServiceClient {
  constructor() {
    this.baseUrl = process.env.PAYMENT_MICROSERVICE_URL;
    this.packageId = process.env.PAYMENT_PACKAGE_ID;
    this.jwtSecret = process.env.PAYMENT_JWT_SECRET;
  }

  generateToken(userId) {
    const jwt = require('jsonwebtoken');
    const payload = {
      userId: userId,
      appId: this.packageId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60)
    };
    return jwt.sign(payload, this.jwtSecret);
  }

  getHeaders(userId) {
    return {
      'Authorization': `Bearer ${this.generateToken(userId)}`,
      'x-app-id': this.packageId,
      'Content-Type': 'application/json'
    };
  }

  async createOrder(userId, amount, currency = 'INR', paymentContext = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/order`, {
        userId,
        amount, // Amount in paise
        currency,
        paymentContext
      }, {
        headers: this.getHeaders(userId)
      });
      
      return response.data;
    } catch (error) {
      console.error('Order creation failed:', error.response?.data);
      throw error;
    }
  }

  async createSubscription(userId, planId, paymentContext = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/subscription`, {
        userId,
        planId,
        paymentContext
      }, {
        headers: this.getHeaders(userId)
      });
      
      return response.data;
    } catch (error) {
      console.error('Subscription creation failed:', error.response?.data);
      throw error;
    }
  }

  async getUserOrders(userId, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/payment/orders`, {
        params: { page, limit },
        headers: this.getHeaders(userId)
      });
      
      return response.data;
    } catch (error) {
      console.error('Get orders failed:', error.response?.data);
      throw error;
    }
  }

  async getUserSubscriptions(userId, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/payment/subscriptions`, {
        params: { page, limit },
        headers: this.getHeaders(userId)
      });
      
      return response.data;
    } catch (error) {
      console.error('Get subscriptions failed:', error.response?.data);
      throw error;
    }
  }

  async verifyPayment(userId, verificationData) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/verify-success`, 
        verificationData, 
        {
          headers: this.getHeaders(userId)
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Payment verification failed:', error.response?.data);
      throw error;
    }
  }
}

module.exports = PaymentServiceClient;
```

### 4. Payment Callback Handler

Implement the callback endpoint in your backend:

```javascript
// Route: POST /api/payment/callback
app.post('/api/payment/callback', async (req, res) => {
  try {
    const { 
      userId, 
      orderId, 
      subscriptionId, 
      razorpayOrderId, 
      razorpaySubscriptionId, 
      status, 
      paymentContext 
    } = req.body;

    console.log('Payment callback received:', {
      userId,
      orderId,
      subscriptionId,
      status,
      paymentContext
    });

    // Update your database based on payment status
    if (status === 'paid' || status === 'active') {
      // Handle successful payment
      if (subscriptionId) {
        // Update user subscription status
        await updateUserSubscription(userId, subscriptionId, status);
      }
      
      if (orderId) {
        // Update order status
        await updateOrderStatus(orderId, status);
      }
    }

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('Callback processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Callback processing failed'
    });
  }
});
```

## 📋 Razorpay Plan Configuration

### Required Plans

You need to create these plans in your Razorpay dashboard:

1. **Trial Plan** (Optional)
   - Plan ID: `plan_kids_story_trial`
   - Amount: ₹1 (100 paise)
   - Billing Cycle: 7 days

2. **Monthly Plan**
   - Plan ID: `plan_kids_story_monthly`
   - Amount: ₹99 (9900 paise) + GST
   - Billing Cycle: Monthly

3. **Yearly Plan**
   - Plan ID: `plan_kids_story_yearly`
   - Amount: ₹499 (49900 paise) + GST
   - Billing Cycle: Yearly

### Plan Creation Script

```bash
# Use Razorpay API to create plans
curl -X POST https://api.razorpay.com/v1/plans \
  -u YOUR_KEY_ID:YOUR_KEY_SECRET \
  -H "Content-Type: application/json" \
  -d '{
    "period": "monthly",
    "interval": 1,
    "item": {
      "name": "Kids Story Monthly Plan",
      "amount": 9900,
      "currency": "INR",
      "description": "Monthly subscription for Kids Story app"
    }
  }'
```

## 🔗 API Endpoints

All API calls should be made to: `https://payments.gumbotech.in`

### Required Headers
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "x-app-id": "com.sunostories.app",
  "Content-Type": "application/json"
}
```

### Available Endpoints

1. **Create Order**: `POST /api/payment/order`
2. **Create Subscription**: `POST /api/payment/subscription`
3. **Get User Orders**: `GET /api/payment/orders`
4. **Get User Subscriptions**: `GET /api/payment/subscriptions`
5. **Verify Payment**: `POST /api/payment/verify-success`

## ✅ Integration Checklist

- [ ] Add `com.sunostories.app` to payment microservice configuration
- [ ] Set up environment variables in payment microservice
- [ ] Create Razorpay plans for Kids Story app
- [ ] Implement JWT token generation in Kids Story backend
- [ ] Create PaymentServiceClient in Kids Story backend
- [ ] Implement payment callback handler
- [ ] Set up callback URL endpoint
- [ ] Test order creation flow
- [ ] Test subscription creation flow
- [ ] Test payment verification flow
- [ ] Test callback handling
- [ ] Configure production URLs and secrets

## 🚨 Security Requirements

1. **JWT Secret**: Minimum 32 characters, unique for Kids Story backend
2. **HTTPS**: All communication must use HTTPS in production
3. **Callback URL**: Must be accessible from payment microservice
4. **Rate Limiting**: Default 100 requests per 15 minutes
5. **CORS**: Configure allowed origins for your frontend domains

## 📞 Support

For integration support, contact the payment microservice team with:
- Package ID: `com.sunostories.app`
- Backend Name: `backend-c-sunostories`
- Any error logs or integration issues
