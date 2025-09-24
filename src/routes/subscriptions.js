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
    .isIn(['plan_RAeTVEtz6dFtPY', 'plan_RAeTumFCrDrT4X', 'plan_kids_story_trial', 'plan_kids_story_monthly', 'plan_kids_story_yearly'])
    .withMessage('Plan ID must be a valid Razorpay plan ID (plan_RAeTVEtz6dFtPY for monthly, plan_RAeTumFCrDrT4X for yearly)'),
  body('paymentContext')
    .optional()
    .isObject()
    .withMessage('Payment context must be an object')
];

const validateSubscriptionUpdate = [
  body('planId')
    .optional()
    .isIn(['plan_RAeTVEtz6dFtPY', 'plan_RAeTumFCrDrT4X', 'plan_kids_story_trial', 'plan_kids_story_monthly', 'plan_kids_story_yearly'])
    .withMessage('Plan ID must be a valid Razorpay plan ID (plan_RAeTVEtz6dFtPY for monthly, plan_RAeTumFCrDrT4X for yearly)')
];

// Helper function to convert plan ID to plan type for trial-aware system
const getPlanTypeFromPlanId = (planId) => {
  const planMapping = {
    // Kids Story specific plan IDs
    'plan_RAeTVEtz6dFtPY': 'monthly',
    'plan_RAeTumFCrDrT4X': 'yearly',
    'plan_kids_story_monthly': 'monthly',
    'plan_kids_story_yearly': 'yearly',
    'plan_kids_story_trial': 'monthly' // Default to monthly for trial
  };
  return planMapping[planId] || 'monthly';
};

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

// POST /subscriptions - Create a new subscription with TRIAL SUPPORT
router.post('/', authenticate, validateSubscriptionCreation, handleValidationErrors, async (req, res) => {
  try {
    const { planId, paymentContext = {} } = req.body;
    const userId = req.userId;

    // Check if user already has an active subscription
    const user = await User.findById(userId);
    if (user.subscription?.status === 'active' && user.subscription?.plan !== 'free') {
      return res.status(409).error(['User already has an active subscription'], 'Subscription creation failed');
    }

    // Convert planId to planType for trial-aware system
    const planType = getPlanTypeFromPlanId(planId);

    // Build enhanced payment context with user data
    const enhancedPaymentContext = {
      ...paymentContext,
      metadata: {
        userName: user.name || 'User',
        userEmail: user.email,
        userPhone: user.phone || paymentContext.metadata?.userPhone || '9999999999', // Use user phone or fallback
        userId: userId,
        packageId: 'com.sunostories.app',
        planId: planId,
        planType: planType,
        ...paymentContext.metadata // Allow override from request
      }
    };

    logger.info('Creating TRIAL-AWARE subscription with context:', {
      userId,
      planId,
      planType,
      userEmail: user.email,
      userPhone: enhancedPaymentContext.metadata.userPhone,
      packageId: enhancedPaymentContext.metadata.packageId
    });

    // Create subscription via payment microservice with TRIAL SUPPORT
    const callbackOverride = process.env.PAYMENT_CALLBACK_OVERRIDE;
    const subscription = await paymentService.createSubscriptionTrialAware(userId, planType, enhancedPaymentContext, callbackOverride);

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

// GET /subscriptions/trial-eligibility - Check if user is eligible for trial
router.get('/trial-eligibility', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const packageId = 'com.sunostories.app';

    logger.info(`Checking trial eligibility for user ${userId}`);

    // Check trial eligibility via payment microservice
    const eligibilityResult = await paymentService.checkTrialEligibility(userId, packageId);

    res.success(eligibilityResult.data, 'Trial eligibility checked successfully');

  } catch (error) {
    logger.error('Trial eligibility check error:', error);
    res.status(500).error(['Failed to check trial eligibility'], 'Internal server error');
  }
});

// GET /subscriptions/plans - Get available subscription plans (TRIAL-AWARE)
router.get('/plans', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const packageId = 'com.sunostories.app';

    // Check if payment microservice is enabled
    const isMicroserviceEnabled = () => {
      return process.env.USE_PAYMENT_MICROSERVICE === 'true' &&
             process.env.PAYMENT_MICROSERVICE_URL &&
             process.env.PAYMENT_JWT_SECRET;
    };

    let trialEligible = false;

    // Check trial eligibility via payment microservice
    if (isMicroserviceEnabled()) {
      try {
        console.log('Checking trial eligibility for user:', {
          userId,
          packageId,
          microserviceEnabled: isMicroserviceEnabled()
        });

        const trialEligibilityResult = await paymentService.checkTrialEligibility(userId, packageId);
        trialEligible = trialEligibilityResult.success && trialEligibilityResult.data?.isTrialEligible;

        console.log('Trial eligibility check result:', {
          userId,
          packageId,
          trialEligible,
          trialUsed: trialEligibilityResult.data?.trialUsed,
          fullResponse: trialEligibilityResult
        });
      } catch (error) {
        console.warn('Failed to check trial eligibility:', error.message);
        console.error('Trial eligibility error details:', error);
        trialEligible = false;
      }
    } else {
      console.log('Payment microservice is disabled, skipping trial eligibility check');
    }

    // Define all plan configurations with Kids Story specific plan IDs
    const allPlanConfigs = [
      {
        id: 'plan_RAeTVEtz6dFtPY',
        name: 'Monthly Plan',
        price: 99,
        priceAfterTax: 117,
        currency: 'INR',
        interval: 'month',
        validityInDays: 30,
        plan: 'monthly',
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
        id: 'plan_RAeTumFCrDrT4X',
        name: 'Yearly Plan',
        price: 499,
        priceAfterTax: 587,
        currency: 'INR',
        interval: 'year',
        validityInDays: 365,
        plan: 'yearly',
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

    let subscriptionList;

    if (trialEligible) {
      // Trial eligible users: show only monthly plan with trial option
      console.log('Trial eligible user - showing only monthly plan with trial option');
      subscriptionList = allPlanConfigs
        .filter(config => config.plan === 'monthly')
        .map(config => ({
          ...config,
          freeTrial: true,
          trialPrice: 3 // ₹3 trial
        }));
    } else {
      // Non-trial eligible users: show both plans without trial
      console.log('Non-trial eligible user - showing both monthly and yearly plans');
      subscriptionList = allPlanConfigs.map(config => ({
        ...config,
        freeTrial: false,
        trialPrice: 0
      }));
    }

    res.success({
      subscriptionList,
      trialEligible,
      apiKey: process.env.RAZORPAY_KEY_ID || 'rzp_live_EWIcFTdUd0CymA'
    }, 'Subscription plans retrieved successfully');

  } catch (error) {
    logger.error('Get plans error:', error);
    res.status(500).error(['Failed to retrieve subscription plans'], 'Internal server error');
  }
});

// POST /subscriptions/callback - Handle payment microservice callbacks
router.post('/callback', async (req, res) => {
  try {
    const { event, userId, sourceApp, data, timestamp } = req.body;

    logger.info('Payment microservice callback received:', {
      event,
      userId,
      sourceApp,
      data,
      timestamp
    });

    // Validate callback payload
    if (!event || !userId || !data) {
      logger.warn('Invalid callback payload received:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Invalid callback payload'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`User not found for callback: ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Handle different subscription events
    let subscriptionUpdate = {};
    let logMessage = '';

    switch (event) {
      case 'subscription.activated':
        subscriptionUpdate = {
          status: 'active',
          razorpaySubscriptionId: data.subscriptionId,
          plan: data.planType || 'monthly',
          provider: 'razorpay',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
          trialUsed: data.trialUsed || false,
          activatedAt: new Date()
        };
        logMessage = 'Subscription activated';
        break;

      case 'subscription.cancelled':
        subscriptionUpdate = {
          status: 'cancelled',
          cancelledAt: data.endedAt ? new Date(data.endedAt) : new Date(),
          currentPeriodEnd: data.endedAt ? new Date(data.endedAt) : new Date()
        };
        logMessage = 'Subscription cancelled';
        break;

      case 'subscription.halted':
        subscriptionUpdate = {
          status: 'inactive', // Use inactive instead of halted for consistency
          haltedAt: data.haltedAt ? new Date(data.haltedAt) : new Date()
        };
        logMessage = 'Subscription halted due to payment failure';
        break;

      case 'subscription.completed':
        subscriptionUpdate = {
          status: 'completed',
          completedAt: data.completedAt ? new Date(data.completedAt) : new Date()
        };
        logMessage = 'Subscription completed';
        break;

      case 'invoice.paid':
        subscriptionUpdate = {
          status: 'active',
          razorpaySubscriptionId: data.razorpaySubscriptionId || data.subscriptionId,
          plan: data.planType || 'monthly',
          provider: 'razorpay',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
          trialUsed: data.trialUsed || false,
          lastPaymentDate: new Date(),
          activatedAt: new Date()
        };
        logMessage = 'Invoice paid - subscription activated';
        break;

      case 'invoice.paid':
        // Update billing dates for recurring payments
        subscriptionUpdate = {
          status: 'active',
          nextBillingDate: data.nextBillingDate ? new Date(data.nextBillingDate) : null,
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
          lastPaymentDate: new Date()
        };
        logMessage = 'Recurring payment processed';
        break;

      default:
        logger.warn(`Unhandled callback event: ${event}`);
        return res.json({
          success: true,
          message: 'Event acknowledged but not processed'
        });
    }

    // Update user subscription - merge with existing subscription data
    const currentSubscription = user.subscription || {};
    const newSubscription = {
      ...currentSubscription,
      ...subscriptionUpdate
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          subscription: newSubscription
        }
      },
      { new: true }
    );

    // Determine premium status after update
    const isPremium = updatedUser.subscription &&
                     updatedUser.subscription.status === 'active';

    logger.info(`${logMessage} for user ${userId}:`, {
      event,
      subscriptionUpdate,
      currentSubscriptionStatus: updatedUser.subscription?.status,
      isPremium,
      fullSubscription: updatedUser.subscription
    });

    res.json({
      success: true,
      message: `${logMessage} successfully`,
      data: {
        userId,
        isPremium,
        subscriptionStatus: updatedUser.subscription.status,
        event
      }
    });

  } catch (error) {
    logger.error('Subscription callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process callback'
    });
  }
});

module.exports = router;
