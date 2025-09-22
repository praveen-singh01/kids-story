# Subscription Management Updates

## Overview
This document summarizes the updates made to the kids-story backend to improve subscription management, trial payment handling, and premium status tracking.

## Changes Made

### 1. User Model Updates (`backend/src/models/User.js`)

**Enhanced Subscription Schema:**
```javascript
const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly', 'premium'], // Added monthly/yearly
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  provider: {
    type: String,
    enum: ['stripe', 'razorpay'], // Added razorpay
    default: null
  },
  providerRef: {
    type: String,
    default: null
  },
  // NEW FIELDS:
  trialUsed: {
    type: Boolean,
    default: false
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  razorpaySubscriptionId: {
    type: String,
    default: null
  },
  razorpayCustomerId: {
    type: String,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: null
  }
}, { _id: false });
```

### 2. User Profile API Updates (`backend/src/routes/users.js`)

**Added `isPremium` field to `/users/me` response:**
```javascript
// GET /users/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;

    // Determine if user is premium based on subscription
    const isPremium = user.subscription && 
                     user.subscription.status === 'active' && 
                     (user.subscription.plan === 'premium' || 
                      user.subscription.plan === 'monthly' || 
                      user.subscription.plan === 'yearly') &&
                     (!user.subscription.currentPeriodEnd || 
                      new Date() < user.subscription.currentPeriodEnd);

    const userResponse = {
      ...user.toJSON(),
      isPremium: isPremium, // NEW FIELD
      preferences: {
        language: user.preferences?.language || 'en'
      },
      avatarId: user.avatarId || null
    };

    res.success(userResponse, 'User profile retrieved successfully');
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).error(['Failed to retrieve user profile'], 'Internal server error');
  }
});
```

### 3. Payment Service Updates (`backend/src/services/paymentService.js`)

**Added Trial Payment Verification Handler:**
```javascript
/**
 * Handle trial payment verification and update subscription
 */
async handleTrialPaymentVerification(userId, paymentData) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update subscription after successful trial payment
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 30); // 30 days trial

    user.subscription = {
      ...user.subscription,
      plan: 'monthly', // Set to monthly plan after trial
      status: 'active',
      provider: 'razorpay',
      providerRef: paymentData.razorpaySubscriptionId || paymentData.subscriptionId,
      trialUsed: false, // Set to false after successful trial payment
      trialEndDate: trialEndDate,
      currentPeriodEnd: trialEndDate,
      razorpaySubscriptionId: paymentData.razorpaySubscriptionId,
      razorpayCustomerId: paymentData.razorpayCustomerId,
      nextBillingDate: trialEndDate
    };

    await user.save();
    logger.info(`Trial payment verified and subscription activated for user ${userId}`);
    return user;
  } catch (error) {
    logger.error('Handle trial payment verification error:', error);
    throw error;
  }
}
```

### 4. Payment Callback Updates (`backend/src/routes/payment.js`)

**Enhanced Payment Callback Handler:**
```javascript
// POST /payment/callback - Handle payment callbacks from microservice
router.post('/callback', async (req, res) => {
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

    // Update database based on payment status
    if (status === 'paid' || status === 'active') {
      if (subscriptionId) {
        // Check if this is a trial payment
        const isTrialPayment = paymentContext?.metadata?.planType === 'trial' || 
                              paymentContext?.isTrial === true ||
                              (paymentContext?.amount && paymentContext.amount <= 500);

        if (isTrialPayment) {
          // Handle trial payment verification
          await paymentService.handleTrialPaymentVerification(userId, {
            subscriptionId,
            razorpaySubscriptionId,
            razorpayCustomerId: paymentContext?.razorpayCustomerId,
            status: 'active'
          });
        } else {
          // Handle regular subscription payment
          await paymentService.updateUserSubscription(userId, {
            status: status,
            providerRef: razorpaySubscriptionId,
            provider: 'razorpay',
            razorpaySubscriptionId: razorpaySubscriptionId,
            razorpayCustomerId: paymentContext?.razorpayCustomerId,
            plan: paymentContext?.metadata?.planType || 'monthly',
            trialUsed: false // Set to false after successful payment
          });
        }
      }
    } else if (status === 'failed' || status === 'cancelled') {
      if (status === 'cancelled' && subscriptionId) {
        // Handle subscription cancellation
        await paymentService.updateUserSubscription(userId, {
          status: 'cancelled',
          cancelledAt: new Date()
        });
        logger.info(`Subscription cancelled for user ${userId}: ${subscriptionId}`);
      }
    }

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });
  } catch (error) {
    logger.error('Callback processing failed:', error);
    res.status(500).json({
      success: false,
      error: 'Callback processing failed'
    });
  }
});
```

### 5. Flutter App Updates (`kidstory-app/lib/core/api/models/user.dart`)

**Enhanced Subscription Model:**
```dart
class Subscription {
  final String plan;
  final String status;
  final DateTime? currentPeriodEnd;
  final String? provider;
  final String? providerRef;
  final bool trialUsed;
  final DateTime? trialEndDate;
  final String? razorpaySubscriptionId;
  final String? razorpayCustomerId;
  final DateTime? nextBillingDate;
  final DateTime? updatedAt;

  // Constructor and fromJson updated accordingly
}

class User {
  // ... existing fields
  final bool isPremium; // NEW FIELD from backend
  
  // Constructor and fromJson updated accordingly
}
```

## Key Features Implemented

### ✅ 1. Trial Payment Handling
- **Issue**: `trialUsed` should be set to `false` after successful trial payment
- **Solution**: Added `handleTrialPaymentVerification()` method that properly sets `trialUsed: false` after payment verification
- **Result**: Users who complete trial payment will have `trialUsed: false` in their subscription

### ✅ 2. Premium Status in User Profile
- **Issue**: Need `isPremium` field in `/users/me` response
- **Solution**: Added logic to calculate `isPremium` based on subscription status, plan, and period validity
- **Result**: Frontend now receives `isPremium: true/false` in user profile API

### ✅ 3. Subscription Cancellation Handling
- **Issue**: Subscription cancellation through Razorpay webhooks should automatically stop subscription
- **Solution**: Enhanced payment callback to handle `cancelled` status and update user subscription accordingly
- **Result**: When payment microservice sends cancellation webhook, user subscription is marked as cancelled

## Webhook Flow

The payment microservice (https://payments.gumbotech.in) handles Razorpay webhooks and sends callbacks to our backend:

1. **Razorpay Webhook** → **Payment Microservice** → **Kids Story Backend (`/payment/callback`)**
2. **Payment Microservice** processes webhook events and sends structured callbacks
3. **Kids Story Backend** updates user subscription based on callback data
4. **Subscription cancellation** is automatically handled when microservice sends `status: 'cancelled'`

## Testing

- Payment callback tests are passing
- Trial payment verification logic tested
- Subscription cancellation handling verified
- User profile API returns correct `isPremium` status

## Next Steps

1. **Test end-to-end flow** with actual Razorpay payments
2. **Verify webhook delivery** from payment microservice
3. **Monitor subscription status updates** in production
4. **Test subscription cancellation** flow with real users

## Environment Variables Required

```bash
# Payment Microservice Configuration
USE_PAYMENT_MICROSERVICE=true
PAYMENT_MICROSERVICE_URL=https://payments.gumbotech.in
PAYMENT_JWT_SECRET=your_jwt_secret
PAYMENT_PACKAGE_ID=com.sunostories.app

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

All changes are backward compatible and maintain existing functionality while adding the requested features.
