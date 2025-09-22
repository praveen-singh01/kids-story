const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { User } = require('../models');
const paymentService = require('../services/paymentService');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).error(errorMessages, 'Validation failed');
  }
  next();
};

// Validation middleware for order creation
const validateOrderCreation = [
  body('amount')
    .isInt({ min: 1 })
    .withMessage('Amount must be a positive integer (in paise)'),
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD'),
  body('paymentContext')
    .optional()
    .isObject()
    .withMessage('Payment context must be an object')
];

// Validation middleware for subscription creation
const validateSubscriptionCreation = [
  body('planId')
    .notEmpty()
    .isString()
    .withMessage('Plan ID is required'),
  body('paymentContext')
    .optional()
    .isObject()
    .withMessage('Payment context must be an object')
];

// Validation middleware for payment verification
const validatePaymentVerification = [
  body('razorpayOrderId')
    .optional()
    .isString()
    .withMessage('Razorpay order ID must be a string'),
  body('razorpaySubscriptionId')
    .optional()
    .isString()
    .withMessage('Razorpay subscription ID must be a string'),
  body('razorpayPaymentId')
    .optional()
    .isString()
    .withMessage('Razorpay payment ID must be a string'),
  body('razorpaySignature')
    .optional()
    .isString()
    .withMessage('Razorpay signature must be a string'),
  // Legacy field names for backward compatibility
  body('razorpay_order_id')
    .optional()
    .isString()
    .withMessage('Razorpay order ID must be a string'),
  body('razorpay_payment_id')
    .optional()
    .isString()
    .withMessage('Razorpay payment ID must be a string'),
  body('razorpay_signature')
    .optional()
    .isString()
    .withMessage('Razorpay signature must be a string')
];

// POST /payment/order - Create a new order
router.post('/order', authenticate, validateOrderCreation, handleValidationErrors, async (req, res) => {
  try {
    const { amount, currency = 'INR', paymentContext = {} } = req.body;
    const userId = req.userId;

    const order = await paymentService.createOrder(userId, amount, currency, paymentContext);

    logger.info(`Order created for user ${userId}: ${order.orderId}`);

    res.status(201).success({
      orderId: order.orderId,
      amount: order.amount,
      currency: order.currency,
      razorpayOrderId: order.razorpayOrderId,
      status: order.status
    }, 'Order created successfully');
    
  } catch (error) {
    logger.error('Create order error:', error);
    
    if (error.response?.status === 400) {
      return res.status(400).error([error.response.data.message || 'Invalid order data'], 'Order creation failed');
    }
    
    res.status(500).error(['Failed to create order'], 'Internal server error');
  }
});

// POST /payment/subscription - Create a new subscription
router.post('/subscription', authenticate, validateSubscriptionCreation, handleValidationErrors, async (req, res) => {
  try {
    const { planId, paymentContext = {} } = req.body;
    const userId = req.userId;

    // Get user data for payment context
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).error(['User not found'], 'Subscription creation failed');
    }

    // Build enhanced payment context with user data
    const enhancedPaymentContext = {
      ...paymentContext,
      metadata: {
        userName: user.name || 'User',
        userEmail: user.email,
        userPhone: user.phone || paymentContext.metadata?.userPhone || '9999999999',
        userId: userId,
        packageId: 'com.sunostories.app',
        ...paymentContext.metadata // Allow override from request
      }
    };

    const subscription = await paymentService.createSubscription(userId, planId, enhancedPaymentContext);

    logger.info(`Subscription created for user ${userId}: ${subscription.subscriptionId}`);

    res.status(201).success({
      subscriptionId: subscription.subscriptionId,
      planId: subscription.planId,
      status: subscription.status,
      razorpaySubscriptionId: subscription.razorpaySubscriptionId,
      shortUrl: subscription.shortUrl
    }, 'Subscription created successfully');

  } catch (error) {
    logger.error('Create subscription error:', error);

    if (error.response?.status === 400) {
      const errorMessage = error.response?.data?.error?.message ||
                          error.response?.data?.message ||
                          'Invalid subscription data';
      return res.status(400).error([errorMessage], 'Subscription creation failed');
    }

    res.status(500).error(['Failed to create subscription'], 'Internal server error');
  }
});

// GET /payment/orders - Get user orders
router.get('/orders', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await paymentService.getUserOrders(userId, page, limit);

    res.success(orders, 'Orders retrieved successfully');
    
  } catch (error) {
    logger.error('Get orders error:', error);
    res.status(500).error(['Failed to retrieve orders'], 'Internal server error');
  }
});

// GET /payment/subscriptions - Get user subscriptions
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const subscriptions = await paymentService.getUserSubscriptions(userId, page, limit);

    res.success(subscriptions, 'Subscriptions retrieved successfully');

  } catch (error) {
    logger.error('Get subscriptions error:', error);
    res.status(500).error(['Failed to retrieve subscriptions'], 'Internal server error');
  }
});

// GET /payment/premium-status - Check if user has premium access
router.get('/premium-status', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user data to check premium status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).error(['User not found'], 'Premium status check failed');
    }

    // Determine premium status for Flutter frontend
    const isPremium = user.subscription &&
                     user.subscription.status === 'active' &&
                     ['monthly', 'yearly', 'premium', 'trial'].includes(user.subscription.plan);

    const premiumDetails = {
      isPremium: isPremium,
      subscription: user.subscription || null,
      plan: user.subscription?.plan || null,
      status: user.subscription?.status || 'inactive',
      nextBillingDate: user.subscription?.nextBillingDate || null,
      trialUsed: user.subscription?.trialUsed || false
    };

    logger.info(`Premium status checked for user ${userId}:`, { isPremium, plan: premiumDetails.plan });

    res.success(premiumDetails, 'Premium status retrieved successfully');

  } catch (error) {
    logger.error('Premium status check error:', error);
    res.status(500).error(['Failed to check premium status'], 'Internal server error');
  }
});

// POST /payment/verify - Payment verification endpoint (matches Milo backend pattern)
router.post('/verify', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      razorpayOrderId,
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpaySignature,
      // Legacy field names for backward compatibility
      razorpay_order_id,
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Normalize field names (same as Milo backend)
    const normalizedOrderId = razorpayOrderId || razorpay_order_id;
    const normalizedSubscriptionId = razorpaySubscriptionId || razorpay_subscription_id;
    const normalizedPaymentId = razorpayPaymentId || razorpay_payment_id;
    const normalizedSignature = razorpaySignature || razorpay_signature;

    logger.info('Payment verification request received', {
      userId,
      razorpayOrderId: normalizedOrderId,
      razorpaySubscriptionId: normalizedSubscriptionId,
      razorpayPaymentId: normalizedPaymentId,
      hasSignature: !!normalizedSignature
    });

    // Validate required fields (same as Milo backend)
    if (!normalizedPaymentId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: razorpayPaymentId is required'
      });
    }

    // Smart detection (same as Milo backend)
    let actualOrderId = normalizedOrderId;
    let actualSubscriptionId = normalizedSubscriptionId;

    // If razorpayOrderId starts with 'sub_', it's actually a subscription ID
    if (normalizedOrderId && normalizedOrderId.startsWith('sub_')) {
      actualSubscriptionId = normalizedOrderId;
      actualOrderId = null;
      logger.info('Detected subscription ID in razorpayOrderId field', {
        userId,
        originalOrderId: normalizedOrderId,
        correctedSubscriptionId: actualSubscriptionId
      });
    }

    const isSubscriptionPayment = !!actualSubscriptionId;
    const isOrderPayment = !!actualOrderId;

    // Validate payment identifiers (same as Milo backend)
    if (!isSubscriptionPayment && !isOrderPayment) {
      logger.error('Missing payment identifier', {
        userId,
        actualOrderId,
        actualSubscriptionId
      });
      return res.status(400).json({
        success: false,
        error: 'Missing payment identifier: either razorpayOrderId or razorpaySubscriptionId is required'
      });
    }

    if (isSubscriptionPayment && isOrderPayment) {
      logger.error('Conflicting payment identifiers', {
        userId,
        razorpayOrderId: normalizedOrderId,
        razorpaySubscriptionId: normalizedSubscriptionId,
        actualOrderId,
        actualSubscriptionId
      });
      return res.status(400).json({
        success: false,
        error: 'Conflicting payment identifiers: provide either razorpayOrderId or razorpaySubscriptionId, not both'
      });
    }

    logger.info('Payment type determined', {
      userId,
      isSubscriptionPayment,
      isOrderPayment,
      paymentIdentifier: isOrderPayment ? actualOrderId : actualSubscriptionId
    });

    // Try to verify with payment microservice first
    let verificationResult = null;
    try {
      const verificationData = {
        razorpayOrderId: actualOrderId,
        razorpaySubscriptionId: actualSubscriptionId,
        razorpayPaymentId: normalizedPaymentId,
        razorpaySignature: normalizedSignature
      };

      verificationResult = await paymentService.verifyPayment(userId, verificationData);
      logger.info('Payment microservice verification successful', verificationResult);
    } catch (verifyError) {
      logger.warn('Payment microservice verification failed', verifyError.message);

      // For subscription payments, allow manual update if microservice fails
      if (isSubscriptionPayment && req.body.forceUpdate) {
        logger.info('Force update requested for subscription payment');
      } else {
        return res.status(400).json({
          success: false,
          error: 'Payment verification failed',
          details: verifyError.message
        });
      }
    }

    // Update subscription if it's a subscription payment
    if (isSubscriptionPayment && (verificationResult?.success || req.body.forceUpdate)) {
      try {
        const subscriptionUpdate = {
          status: 'active',
          provider: 'razorpay',
          providerRef: actualSubscriptionId,
          razorpaySubscriptionId: actualSubscriptionId,
          plan: req.body.planType || 'monthly'
        };

        // Set billing date
        const billingDate = new Date();
        if (req.body.planType === 'yearly') {
          billingDate.setFullYear(billingDate.getFullYear() + 1);
        } else {
          billingDate.setMonth(billingDate.getMonth() + 1);
        }
        subscriptionUpdate.nextBillingDate = billingDate;
        subscriptionUpdate.currentPeriodEnd = billingDate;

        if (req.body.trialUsed !== undefined) {
          subscriptionUpdate.trialUsed = req.body.trialUsed;
        }

        const updatedUser = await paymentService.updateUserSubscription(userId, subscriptionUpdate);

        logger.info('User subscription updated after verification', { userId });

        // Determine premium status for Flutter frontend
        const isPremium = updatedUser.subscription &&
                         updatedUser.subscription.status === 'active' &&
                         ['monthly', 'yearly', 'premium', 'trial'].includes(updatedUser.subscription.plan);

        return res.json({
          success: true,
          message: 'Payment verified and subscription updated successfully',
          isPremium: isPremium, // Flag for Flutter frontend to enable premium features
          data: {
            userId: updatedUser._id,
            subscription: updatedUser.subscription,
            verificationResult: verificationResult?.data || null
          }
        });

      } catch (updateError) {
        logger.error('Failed to update user subscription', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update subscription',
          details: updateError.message
        });
      }
    }

    // For order payments or successful verification without subscription update
    // Get user data to check premium status
    const user = await User.findById(userId);
    const isPremium = user?.subscription &&
                     user.subscription.status === 'active' &&
                     ['monthly', 'yearly', 'premium', 'trial'].includes(user.subscription.plan);

    return res.json({
      success: true,
      message: 'Payment verified successfully',
      isPremium: isPremium, // Flag for Flutter frontend to enable premium features
      data: {
        verificationResult: verificationResult?.data || null
      }
    });

  } catch (error) {
    logger.error('Payment verification failed', {
      userId: req.userId,
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      details: error.message
    });
  }
});

// POST /payment/verify-manual - Manual payment verification and DB update
router.post('/verify-manual', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      razorpaySubscriptionId,
      razorpayOrderId,
      planType = 'monthly',
      forceUpdate = false
    } = req.body;

    if (!razorpaySubscriptionId && !razorpayOrderId) {
      return res.status(400).error(['Either razorpaySubscriptionId or razorpayOrderId is required'], 'Invalid request');
    }

    logger.info(`Manual payment verification requested for user ${userId}:`, {
      razorpaySubscriptionId,
      razorpayOrderId,
      planType,
      forceUpdate
    });

    // First try to verify with payment microservice
    let verificationResult = null;
    try {
      const verificationData = {};
      if (razorpaySubscriptionId) verificationData.razorpaySubscriptionId = razorpaySubscriptionId;
      if (razorpayOrderId) verificationData.razorpayOrderId = razorpayOrderId;

      verificationResult = await paymentService.verifyPayment(userId, verificationData);
      logger.info(`Payment microservice verification result:`, verificationResult);
    } catch (verifyError) {
      logger.warn(`Payment microservice verification failed:`, verifyError.message);
      if (!forceUpdate) {
        return res.status(400).error([`Payment verification failed: ${verifyError.message}`], 'Verification failed');
      }
    }

    // Update user subscription in database
    const subscriptionUpdate = {
      status: 'active',
      plan: planType === 'yearly' ? 'yearly' : 'monthly',
      provider: 'razorpay',
      providerRef: razorpaySubscriptionId || razorpayOrderId
    };

    if (razorpaySubscriptionId) {
      subscriptionUpdate.razorpaySubscriptionId = razorpaySubscriptionId;
    }

    // Set billing dates based on plan type
    const now = new Date();
    const billingDate = new Date(now);
    if (planType === 'yearly') {
      billingDate.setFullYear(billingDate.getFullYear() + 1);
    } else {
      billingDate.setMonth(billingDate.getMonth() + 1);
    }
    subscriptionUpdate.nextBillingDate = billingDate;
    subscriptionUpdate.currentPeriodEnd = billingDate;

    const updatedUser = await paymentService.updateUserSubscription(userId, subscriptionUpdate);

    logger.info(`Manual payment verification completed for user ${userId}`);

    // Determine premium status for Flutter frontend
    const isPremium = updatedUser.subscription &&
                     updatedUser.subscription.status === 'active' &&
                     ['monthly', 'yearly', 'premium', 'trial'].includes(updatedUser.subscription.plan);

    res.success({
      isPremium: isPremium, // Flag for Flutter frontend to enable premium features
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        subscription: updatedUser.subscription
      },
      verificationResult: verificationResult?.data || null,
      message: 'Payment verified and subscription updated successfully'
    }, 'Manual verification completed');

  } catch (error) {
    logger.error('Manual payment verification error:', error);
    res.status(500).error(['Failed to verify payment manually'], 'Internal server error');
  }
});

// POST /payment/callback - Handle payment callbacks from microservice (supports both formats)
router.post('/callback', async (req, res) => {
  try {
    // Support new trial-aware callback format (same as Milo backend)
    if (typeof req.body?.success === 'boolean' && req.body?.userId) {
      logger.info('Processing trial-aware callback format');

      const {
        success,
        userId,
        packageName,
        planType,
        trialUsed,
        status,
        razorpaySubscriptionId,
        nextBillingDate
      } = req.body;

      // Validate package name matches expected
      const expectedPackageName = process.env.PAYMENT_PACKAGE_ID || 'com.sunostories.app';
      if (packageName !== expectedPackageName) {
        logger.warn('Package ID mismatch in trial-aware callback', {
          expected: expectedPackageName,
          received: packageName
        });
        return res.status(400).json({
          success: false,
          message: 'Package ID mismatch'
        });
      }

      logger.info('Processing trial-aware payment callback', {
        success,
        userId,
        packageName,
        planType,
        trialUsed,
        status,
        razorpaySubscriptionId
      });

      if (success && (status === 'active' || status === 'paid')) {
        // Update user subscription with trial-aware data
        await paymentService.updateUserSubscription(userId, {
          status: 'active',
          plan: planType || 'monthly',
          provider: 'razorpay',
          providerRef: razorpaySubscriptionId,
          razorpaySubscriptionId: razorpaySubscriptionId,
          trialUsed: trialUsed || false,
          nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
          currentPeriodEnd: nextBillingDate ? new Date(nextBillingDate) : null
        });

        logger.info(`Trial-aware subscription activated for user ${userId} with plan: ${planType}`);
      } else {
        logger.warn('Trial-aware callback indicates failure', {
          success,
          userId,
          status
        });
      }

      return res.json({
        success: true,
        message: 'Trial-aware callback processed successfully'
      });
    }

    // Legacy callback format handling
    const {
      userId,
      orderId,
      subscriptionId,
      razorpayOrderId,
      razorpaySubscriptionId,
      status,
      paymentContext
    } = req.body;

    logger.info('Payment callback received (legacy format):', {
      userId,
      orderId,
      subscriptionId,
      status,
      paymentContext
    });

    // Update database based on payment status
    if (status === 'paid' || status === 'active') {
      // Handle successful payment
      if (subscriptionId) {
        // Extract additional data from paymentContext and request body
        const { planType, trialUsed, nextBillingDate } = req.body;

        // Check if this is a trial payment based on payment context
        const isTrialPayment = paymentContext?.metadata?.planType === 'trial' ||
                              paymentContext?.isTrial === true ||
                              planType === 'trial' ||
                              (paymentContext?.amount && paymentContext.amount <= 500); // ₹5 or less indicates trial

        if (isTrialPayment) {
          // Handle trial payment verification
          await paymentService.handleTrialPaymentVerification(userId, {
            subscriptionId,
            razorpaySubscriptionId,
            razorpayCustomerId: paymentContext?.razorpayCustomerId,
            status: 'active'
          });
          logger.info(`Trial payment verified and subscription activated for user ${userId}`);
        } else {
          // Handle regular subscription payment with comprehensive data
          await paymentService.updateUserSubscription(userId, {
            status: 'active',
            plan: planType === 'trial' ? 'trial' : (planType || paymentContext?.metadata?.planType || 'premium'),
            provider: 'razorpay',
            providerRef: razorpaySubscriptionId,
            razorpaySubscriptionId: razorpaySubscriptionId,
            razorpayCustomerId: paymentContext?.razorpayCustomerId,
            trialUsed: trialUsed || false,
            nextBillingDate: nextBillingDate ? new Date(nextBillingDate) : null,
            currentPeriodEnd: nextBillingDate ? new Date(nextBillingDate) : null
          });
          logger.info(`Subscription ${subscriptionId} activated for user ${userId} with plan: ${planType || 'premium'}`);
        }
      }

      if (orderId) {
        // Update order status
        await paymentService.updateOrderStatus(orderId, status);
        logger.info(`Order ${orderId} marked as paid`);
      }
    } else if (status === 'failed' || status === 'cancelled') {
      // Handle failed/cancelled payment
      if (status === 'cancelled' && subscriptionId) {
        // Handle subscription cancellation
        await paymentService.updateUserSubscription(userId, {
          status: 'cancelled',
          cancelledAt: new Date()
        });
        logger.info(`Subscription cancelled for user ${userId}: ${subscriptionId}`);
      }
      logger.warn(`Payment ${status} for user ${userId}:`, { orderId, subscriptionId });

      // Update subscription status to reflect failure
      if (subscriptionId) {
        await paymentService.updateUserSubscription(userId, {
          status: status === 'failed' ? 'inactive' : 'cancelled'
        });
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

module.exports = router;
