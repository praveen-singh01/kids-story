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

// POST /payment/verify-success - Verify payment success
router.post('/verify-success', authenticate, validatePaymentVerification, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.userId;
    const verificationData = req.body;

    const result = await paymentService.verifyPayment(userId, verificationData);

    logger.info(`Payment verification completed for user ${userId}`);

    res.success(result, 'Payment verified successfully');

  } catch (error) {
    logger.error('Payment verification error:', error);

    if (error.response?.status === 400) {
      return res.status(400).error([error.response.data.message || 'Invalid verification data'], 'Payment verification failed');
    }

    res.status(500).error(['Failed to verify payment'], 'Internal server error');
  }
});

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

    logger.info('Payment callback received:', {
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
        // Update user subscription status
        await paymentService.updateUserSubscription(userId, {
          status: status,
          providerRef: razorpaySubscriptionId,
          provider: 'razorpay'
        });
        logger.info(`Subscription ${subscriptionId} activated for user ${userId}`);
      }

      if (orderId) {
        // Update order status
        await paymentService.updateOrderStatus(orderId, status);
        logger.info(`Order ${orderId} marked as paid`);
      }
    } else if (status === 'failed' || status === 'cancelled') {
      // Handle failed/cancelled payment
      logger.warn(`Payment ${status} for user ${userId}:`, { orderId, subscriptionId });
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
