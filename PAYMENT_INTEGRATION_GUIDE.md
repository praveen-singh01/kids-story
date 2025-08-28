# Payment Microservice Integration Guide

This document outlines the integration of the payment microservice with the Kids Story backend application.

## Overview

The payment microservice integration provides:
- Order creation and management
- Subscription management with Razorpay
- Payment verification and callbacks
- User subscription tracking

## Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Payment Microservice Configuration
USE_PAYMENT_MICROSERVICE=true
PAYMENT_MICROSERVICE_URL=https://payments.netaapp.in
PAYMENT_JWT_SECRET=kids_story_payment_jwt_secret_minimum_32_characters_secure_key_2024
PAYMENT_PACKAGE_ID=com.kids.story

# Razorpay Plan IDs (create these in Razorpay dashboard)
RAZORPAY_TRIAL_PLAN_ID=plan_kids_story_trial
RAZORPAY_MONTHLY_PLAN_ID=plan_kids_story_monthly
RAZORPAY_YEARLY_PLAN_ID=plan_kids_story_yearly

# Callback URL (your backend endpoint)
PAYMENT_CALLBACK_URL=http://localhost:3000/api/v1/payment/callback
```

## Required Setup Steps

### 1. Razorpay Dashboard Setup
Create the following subscription plans in your Razorpay dashboard:

1. **Trial Plan** (`plan_kids_story_trial`)
   - Amount: ₹1 (100 paise)
   - Billing Cycle: 7 days
   - Description: "7-day trial access"

2. **Monthly Plan** (`plan_kids_story_monthly`)
   - Amount: ₹99 (9900 paise)
   - Billing Cycle: 1 month
   - Description: "Monthly subscription"

3. **Yearly Plan** (`plan_kids_story_yearly`)
   - Amount: ₹499 (49900 paise)
   - Billing Cycle: 1 year
   - Description: "Yearly subscription"

### 2. Payment Microservice Configuration
Provide the following information to the payment microservice team:

**Required Information:**
- **App ID/Package ID**: `com.kids.story`
- **JWT Secret**: `kids_story_payment_jwt_secret_minimum_32_characters_secure_key_2024`
- **Callback URL**: `http://localhost:3000/api/v1/payment/callback` (update for production)
- **Razorpay Plan IDs**: Use the plan IDs created above

**Callback Payload Format:**
The payment microservice will send callbacks to your endpoint with this payload:
```json
{
  "userId": "string",
  "orderId": "string (optional)",
  "subscriptionId": "string (optional)",
  "razorpayOrderId": "string (optional)",
  "razorpaySubscriptionId": "string (optional)",
  "razorpayPaymentId": "string (optional)",
  "status": "string (paid|failed|active|cancelled|expired)",
  "paymentContext": "object"
}
```

## API Endpoints

### Payment Service Status
```
GET /api/v1/payment/status
```
Check if payment microservice is enabled and configured.

### Subscription Plans
```
GET /api/v1/payment/plans
```
Get available subscription plans.

### Create Order
```
POST /api/v1/payment/order
Content-Type: application/json
Authorization: Bearer <token>

{
  "amount": 9900,
  "currency": "INR",
  "orderType": "subscription",
  "description": "Monthly subscription"
}
```

### Create Subscription
```
POST /api/v1/payment/subscription
Content-Type: application/json
Authorization: Bearer <token>

{
  "planType": "monthly",
  "description": "Monthly subscription"
}
```

### Get User Orders
```
GET /api/v1/payment/orders?page=1&limit=10&status=paid
Authorization: Bearer <token>
```

### Get User Subscriptions
```
GET /api/v1/payment/subscriptions?page=1&limit=10&status=active
Authorization: Bearer <token>
```

### Verify Payment
```
POST /api/v1/payment/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

## Database Models

### Order Model
- Tracks payment orders
- Links to payment microservice order IDs
- Stores Razorpay order and payment IDs
- Maintains order status and metadata

### Subscription Model
- Manages user subscriptions
- Links to payment microservice subscription IDs
- Tracks subscription lifecycle
- Handles plan changes and cancellations

### User Model Updates
- Enhanced subscription schema
- Support for multiple plan types
- Trial tracking
- Subscription status management

## Integration Flow

### Order Creation Flow
1. User initiates payment
2. Backend calls payment microservice to create order
3. Payment microservice returns Razorpay order details
4. Frontend uses Razorpay SDK to process payment
5. Payment microservice sends callback on completion
6. Backend updates order status

### Subscription Flow
1. User selects subscription plan
2. Backend creates subscription via payment microservice
3. Payment microservice creates Razorpay subscription
4. User completes payment
5. Payment microservice activates subscription
6. Callback updates user subscription status
7. User gains access to premium content

## Error Handling

The integration includes comprehensive error handling:
- Network timeouts (30 seconds)
- Invalid responses from payment microservice
- Missing configuration
- Database errors
- Payment verification failures

## Security Considerations

- JWT tokens for payment microservice authentication
- Signature verification for payment callbacks
- Secure environment variable storage
- Input validation on all endpoints
- Rate limiting on payment endpoints (recommended)

## Testing

### Test Payment Service Status
```bash
curl -X GET http://localhost:3000/api/v1/payment/status \
  -H "Authorization: Bearer <your_token>"
```

### Test Subscription Plans
```bash
curl -X GET http://localhost:3000/api/v1/payment/plans \
  -H "Authorization: Bearer <your_token>"
```

### Test Order Creation
```bash
curl -X POST http://localhost:3000/api/v1/payment/order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{"amount": 9900, "orderType": "subscription", "description": "Test order"}'
```

## Production Deployment

Before deploying to production:

1. Update `PAYMENT_CALLBACK_URL` to production URL
2. Use production Razorpay plan IDs
3. Secure JWT secret with strong random string
4. Enable HTTPS for all payment endpoints
5. Set up monitoring for payment callbacks
6. Configure proper logging for payment events

## Support

For issues with the payment microservice integration:
1. Check logs for payment service errors
2. Verify environment configuration
3. Test payment microservice connectivity
4. Contact payment microservice team for service issues

## Monitoring

Key metrics to monitor:
- Payment success/failure rates
- Subscription activation rates
- Callback processing times
- Payment microservice response times
- Order and subscription creation rates
