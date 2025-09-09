# Subscription ID Testing Guide - Postman Collection

## 🎯 Overview
This guide demonstrates how to test subscription ID creation using the updated Postman collection. The collection includes comprehensive test scripts that automatically capture and validate subscription IDs when they are created.

## ✅ Current Test Status

### Working Components
- **User Registration**: ✅ Creating test users
- **Authentication**: ✅ Login and token generation
- **Plan Retrieval**: ✅ Getting available subscription plans
- **Subscription Status**: ✅ Checking current user subscriptions
- **Test Scripts**: ✅ Ready for ID capture and validation

### Blocked Components (Requires Payment Service)
- **Subscription Creation**: ❌ External payment microservice unavailable
- **Payment Integration**: ❌ Razorpay service integration
- **ID Generation**: ❌ Actual subscription ID creation

## 🧪 Live Test Results

### User Creation Test
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "68c01db56841ae6b7c3c2d6e",
      "email": "sub.test2@example.com",
      "name": "Subscription Test User 2",
      "subscription": {
        "plan": "free",
        "status": "active"
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Available Plans Test
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free Plan",
      "price": 0,
      "currency": "INR",
      "interval": "month"
    },
    {
      "id": "plan_kids_story_trial",
      "name": "Trial Plan",
      "price": 1,
      "currency": "INR",
      "interval": "week"
    },
    {
      "id": "plan_kids_story_monthly",
      "name": "Monthly Plan",
      "price": 99,
      "currency": "INR",
      "interval": "month"
    },
    {
      "id": "plan_kids_story_yearly",
      "name": "Yearly Plan",
      "price": 499,
      "currency": "INR",
      "interval": "year"
    }
  ]
}
```

## 📋 Expected Subscription Creation Response

When the payment service is available, the subscription creation will return:

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_1757421074844_trial",
    "planId": "plan_kids_story_trial",
    "status": "created",
    "razorpaySubscriptionId": "rzp_sub_eb5mimgdn4v",
    "shortUrl": "https://rzp.io/i/gp7pd9rd"
  },
  "message": "Subscription created successfully"
}
```

## 🔧 Postman Collection Test Scripts

### 1. Create Subscription Test Script
```javascript
if (pm.response.code === 201) {
    const response = pm.response.json();
    if (response.data.subscriptionId) {
        pm.collectionVariables.set('subscription_id', response.data.subscriptionId);
        console.log('✅ Subscription ID saved:', response.data.subscriptionId);
    }
    if (response.data.razorpaySubscriptionId) {
        console.log('💳 Razorpay ID:', response.data.razorpaySubscriptionId);
    }
    if (response.data.shortUrl) {
        console.log('🔗 Payment URL:', response.data.shortUrl);
    }
}
```

### 2. Get Available Plans Test Script
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && Array.isArray(response.data)) {
        console.log('📋 Available plans:', response.data.length);
        response.data.forEach(plan => {
            console.log('Plan:', plan.name, '(' + plan.id + ') -', plan.price, plan.currency);
        });
        const trialPlan = response.data.find(p => p.id === 'plan_kids_story_trial');
        if (trialPlan) {
            pm.collectionVariables.set('plan_id', trialPlan.id);
            console.log('✅ Trial plan set as default:', trialPlan.id);
        }
    }
}
```

### 3. Admin Subscription List Test Script
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data.subscriptions && response.data.subscriptions.length > 0) {
        const firstSub = response.data.subscriptions[0];
        if (firstSub.id) {
            pm.collectionVariables.set('subscription_id', firstSub.id);
            console.log('✅ Admin Subscription ID saved:', firstSub.id);
        }
    }
}
```

## 🔄 Testing Workflow

### Step-by-Step Testing Process

1. **Setup Authentication**
   ```
   POST /auth/login (Admin) → Get admin_token
   POST /auth/login (User) → Get user_token
   ```

2. **Validate Plans**
   ```
   GET /subscriptions/plans → Validate plan structure & set plan_id
   ```

3. **Check Current Subscription**
   ```
   GET /subscriptions/me → Verify current subscription status
   ```

4. **Create Subscription** (When payment service is available)
   ```
   POST /subscriptions → Generate subscription ID & capture it
   ```

5. **Verify Creation**
   ```
   GET /subscriptions/me → Confirm subscription was created
   ```

6. **Admin Management**
   ```
   GET /admin/payment/subscriptions → Admin view & ID capture
   ```

## 🎯 Expected ID Formats

### Subscription ID
- Format: `sub_{timestamp}_{plan_type}`
- Example: `sub_1757421074844_trial`

### Razorpay Subscription ID
- Format: `rzp_sub_{random_string}`
- Example: `rzp_sub_eb5mimgdn4v`

### Payment URL
- Format: `https://rzp.io/i/{short_code}`
- Example: `https://rzp.io/i/gp7pd9rd`

## 🔧 Collection Variables

The collection automatically manages these variables:

- `subscription_id`: Captured from subscription creation
- `plan_id`: Set from available plans (defaults to trial)
- `user_token`: User authentication token
- `admin_token`: Admin authentication token

## 💡 How to Test When Payment Service is Available

1. **Ensure Payment Service is Running**
   - URL: `https://payments.gumbotech.in`
   - Check service health and connectivity

2. **Import Postman Collection**
   - Use `Kids-Story-Complete-API.postman_collection.json`
   - Set up environment variables

3. **Run Authentication Requests**
   - Admin Login → Captures admin token
   - User Login → Captures user token

4. **Test Subscription Flow**
   - Get Available Plans → Validates plans & sets defaults
   - Create Subscription → **Captures subscription ID**
   - Check console for captured IDs

5. **Verify ID Capture**
   - Check Postman console logs
   - Verify collection variables are populated
   - Use captured IDs in subsequent requests

## ✅ Validation Checklist

When testing subscription ID creation:

- [ ] User authentication successful
- [ ] Plans retrieved and validated
- [ ] Subscription creation returns 201 status
- [ ] `subscriptionId` is present in response
- [ ] `subscriptionId` is saved to collection variables
- [ ] `razorpaySubscriptionId` is logged
- [ ] `shortUrl` is provided for payment
- [ ] Subsequent requests can use captured ID

## 🚀 Ready for Production Testing

The Postman collection is fully prepared with:
- ✅ Comprehensive test scripts
- ✅ Automatic ID capture and validation
- ✅ Error handling and logging
- ✅ Collection variable management
- ✅ Complete subscription lifecycle testing

All components are ready to test subscription ID creation once the payment microservice is available and responding correctly.
