const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const paymentService = require('../services/paymentService');
const { User } = require('../models');
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

// Validation middleware
const validateSubscriptionCreation = [
  body('planId')
    .notEmpty()
    .isIn(['premium-monthly', 'premium-yearly'])
    .withMessage('Plan ID must be premium-monthly or premium-yearly'),
  body('paymentMethodId')
    .notEmpty()
    .isString()
    .withMessage('Payment method ID is required')
];

const validateSubscriptionUpdate = [
  body('planId')
    .optional()
    .isIn(['premium-monthly', 'premium-yearly'])
    .withMessage('Plan ID must be premium-monthly or premium-yearly')
];

// GET /subscriptions/me - Get current user's subscription
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    // Get subscription details from payment service
    const paymentSubscription = await paymentService.getSubscription(user._id);
    
    const subscriptionData = {
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active',
      currentPeriodEnd: user.subscription?.currentPeriodEnd,
      provider: user.subscription?.provider,
      providerRef: user.subscription?.providerRef,
      // Include payment service data if available
      ...(paymentSubscription && {
        paymentDetails: {
          nextBillingDate: paymentSubscription.nextBillingDate,
          amount: paymentSubscription.amount,
          currency: paymentSubscription.currency,
          paymentMethod: paymentSubscription.paymentMethod
        }
      })
    };

    res.success(subscriptionData, 'Subscription details retrieved successfully');
    
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).error(['Failed to retrieve subscription details'], 'Internal server error');
  }
});

// POST /subscriptions - Create a new subscription
router.post('/', authenticate, validateSubscriptionCreation, handleValidationErrors, async (req, res) => {
  try {
    const { planId, paymentMethodId } = req.body;
    const userId = req.userId;

    // Check if user already has an active subscription
    const user = await User.findById(userId);
    if (user.subscription?.status === 'active' && user.subscription?.plan !== 'free') {
      return res.status(409).error(['User already has an active subscription'], 'Subscription creation failed');
    }

    // Create subscription via payment service
    const subscription = await paymentService.createSubscription(userId, planId, paymentMethodId);

    logger.info(`Subscription created for user ${userId}: ${subscription.id}`);

    res.status(201).success({
      subscriptionId: subscription.id,
      plan: subscription.planId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate
    }, 'Subscription created successfully');
    
  } catch (error) {
    logger.error('Create subscription error:', error);
    
    if (error.message === 'User not found') {
      return res.status(404).error([error.message], 'Subscription creation failed');
    }
    
    res.status(500).error(['Failed to create subscription'], 'Internal server error');
  }
});

// PATCH /subscriptions/me - Update current subscription
router.patch('/me', authenticate, validateSubscriptionUpdate, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body;

    const subscription = await paymentService.updateSubscription(userId, updates);

    logger.info(`Subscription updated for user ${userId}: ${subscription.id}`);

    res.success({
      subscriptionId: subscription.id,
      plan: subscription.planId,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      nextBillingDate: subscription.nextBillingDate
    }, 'Subscription updated successfully');
    
  } catch (error) {
    logger.error('Update subscription error:', error);
    
    if (error.message === 'No active subscription found') {
      return res.status(404).error([error.message], 'Subscription update failed');
    }
    
    res.status(500).error(['Failed to update subscription'], 'Internal server error');
  }
});

// POST /subscriptions/me/cancel - Cancel current subscription
router.post('/me/cancel', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const subscription = await paymentService.cancelSubscription(userId);

    logger.info(`Subscription cancelled for user ${userId}: ${subscription.id}`);

    res.success({
      subscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelledAt: subscription.cancelledAt
    }, 'Subscription cancelled successfully');
    
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    
    if (error.message === 'No active subscription found') {
      return res.status(404).error([error.message], 'Subscription cancellation failed');
    }
    
    res.status(500).error(['Failed to cancel subscription'], 'Internal server error');
  }
});

// GET /subscriptions/plans - Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    // In a real app, this might come from the payment service or be configured
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          'Access to basic stories',
          'Limited content library',
          'Standard audio quality'
        ]
      },
      {
        id: 'premium-monthly',
        name: 'Premium Monthly',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Access to all stories',
          'Full content library',
          'High-quality audio',
          'Offline downloads',
          'Ad-free experience',
          'New content weekly'
        ]
      },
      {
        id: 'premium-yearly',
        name: 'Premium Yearly',
        price: 99.99,
        currency: 'USD',
        interval: 'year',
        features: [
          'Access to all stories',
          'Full content library',
          'High-quality audio',
          'Offline downloads',
          'Ad-free experience',
          'New content weekly',
          '2 months free'
        ],
        savings: '17% off monthly price'
      }
    ];

    res.success(plans, 'Subscription plans retrieved successfully');
    
  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).error(['Failed to retrieve subscription plans'], 'Internal server error');
  }
});

// POST /subscriptions/webhooks - Handle payment service webhooks
router.post('/webhooks', async (req, res) => {
  try {
    const event = req.body;
    
    // Verify webhook signature (implementation depends on payment service)
    // const signature = req.headers['x-payment-signature'];
    // if (!verifyWebhookSignature(event, signature)) {
    //   return res.status(401).error(['Invalid webhook signature'], 'Unauthorized');
    // }

    await paymentService.handleWebhook(event);

    res.success({ received: true }, 'Webhook processed successfully');
    
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).error(['Failed to process webhook'], 'Internal server error');
  }
});

module.exports = router;
