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
    .isIn(['plan_kids_story_trial', 'plan_kids_story_monthly', 'plan_kids_story_yearly'])
    .withMessage('Plan ID must be plan_kids_story_trial, plan_kids_story_monthly, or plan_kids_story_yearly'),
  body('paymentContext')
    .optional()
    .isObject()
    .withMessage('Payment context must be an object')
];

const validateSubscriptionUpdate = [
  body('planId')
    .optional()
    .isIn(['plan_kids_story_trial', 'plan_kids_story_monthly', 'plan_kids_story_yearly'])
    .withMessage('Plan ID must be plan_kids_story_trial, plan_kids_story_monthly, or plan_kids_story_yearly')
];

// GET /subscriptions/me - Get current user's subscription
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = req.user;
    const userId = req.userId;

    // Get subscription details from payment microservice
    try {
      const paymentSubscriptions = await paymentService.getUserSubscriptions(userId, 1, 1);
      const activeSubscription = paymentSubscriptions.subscriptions?.find(sub => sub.status === 'active');

      const subscriptionData = {
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'inactive',
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        provider: user.subscription?.provider,
        providerRef: user.subscription?.providerRef,
        // Include payment service data if available
        ...(activeSubscription && {
          paymentDetails: {
            subscriptionId: activeSubscription.subscriptionId,
            planId: activeSubscription.planId,
            status: activeSubscription.status,
            razorpaySubscriptionId: activeSubscription.razorpaySubscriptionId
          }
        })
      };

      res.success(subscriptionData, 'Subscription details retrieved successfully');
    } catch (paymentError) {
      // If payment service is unavailable, return local subscription data
      logger.warn('Payment service unavailable, returning local subscription data:', paymentError.message);

      const subscriptionData = {
        plan: user.subscription?.plan || 'free',
        status: user.subscription?.status || 'inactive',
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        provider: user.subscription?.provider,
        providerRef: user.subscription?.providerRef
      };

      res.success(subscriptionData, 'Subscription details retrieved successfully (local data)');
    }

  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).error(['Failed to retrieve subscription details'], 'Internal server error');
  }
});

// POST /subscriptions - Create a new subscription
router.post('/', authenticate, validateSubscriptionCreation, handleValidationErrors, async (req, res) => {
  try {
    const { planId, paymentContext = {} } = req.body;
    const userId = req.userId;

    // Check if user already has an active subscription
    const user = await User.findById(userId);
    if (user.subscription?.status === 'active' && user.subscription?.plan !== 'free') {
      return res.status(409).error(['User already has an active subscription'], 'Subscription creation failed');
    }

    // Create subscription via payment microservice
    const subscription = await paymentService.createSubscription(userId, planId, paymentContext);

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
      return res.status(400).error([error.response.data.message || 'Invalid subscription data'], 'Subscription creation failed');
    }

    res.status(500).error(['Failed to create subscription'], 'Internal server error');
  }
});

// PATCH /subscriptions/me - Update current subscription
router.patch('/me', authenticate, validateSubscriptionUpdate, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.userId;
    const { planId } = req.body;

    // For the microservice integration, updating subscription means creating a new one
    // This would typically be handled by the payment microservice
    logger.info(`Subscription update requested for user ${userId} to plan ${planId}`);

    res.success({
      message: 'Subscription update initiated. Please use the payment endpoints to create a new subscription.'
    }, 'Subscription update request received');

  } catch (error) {
    logger.error('Update subscription error:', error);
    res.status(500).error(['Failed to update subscription'], 'Internal server error');
  }
});

// POST /subscriptions/me/cancel - Cancel current subscription
router.post('/me/cancel', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user.subscription || user.subscription.status !== 'active') {
      return res.status(404).error(['No active subscription found'], 'Subscription cancellation failed');
    }

    // Update local subscription status to cancelled
    await paymentService.updateUserSubscription(userId, {
      status: 'cancelled',
      cancelledAt: new Date()
    });

    logger.info(`Subscription cancelled for user ${userId}`);

    res.success({
      status: 'cancelled',
      cancelledAt: new Date(),
      message: 'Subscription has been cancelled. Access will continue until the current period ends.'
    }, 'Subscription cancelled successfully');

  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).error(['Failed to cancel subscription'], 'Internal server error');
  }
});

// GET /subscriptions/plans - Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    // Updated plans to match the payment microservice configuration
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        currency: 'INR',
        interval: 'month',
        features: [
          'Access to basic stories',
          'Limited content library',
          'Standard audio quality'
        ]
      },
      {
        id: 'plan_kids_story_trial',
        name: 'Trial Plan',
        price: 1,
        currency: 'INR',
        interval: 'week',
        billingCycle: '7 days',
        features: [
          'Access to all stories',
          'Full content library',
          'High-quality audio',
          '7-day trial period'
        ]
      },
      {
        id: 'plan_kids_story_monthly',
        name: 'Monthly Plan',
        price: 99,
        currency: 'INR',
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
        id: 'plan_kids_story_yearly',
        name: 'Yearly Plan',
        price: 499,
        currency: 'INR',
        interval: 'year',
        features: [
          'Access to all stories',
          'Full content library',
          'High-quality audio',
          'Offline downloads',
          'Ad-free experience',
          'New content weekly',
          'Best value - Save 58%'
        ],
        savings: '58% off monthly price'
      }
    ];

    res.success(plans, 'Subscription plans retrieved successfully');

  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).error(['Failed to retrieve subscription plans'], 'Internal server error');
  }
});

module.exports = router;
