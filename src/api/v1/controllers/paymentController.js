const PaymentServiceClient = require('../../../services/paymentService');
const Order = require('../../../models/Order');
const Subscription = require('../../../models/Subscription');
const User = require('../../../models/User');
const { success, error } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');

const paymentService = new PaymentServiceClient();

/**
 * Create a payment order
 */
const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', orderType = 'other', relatedId, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json(error('Amount is required and must be greater than 0'));
    }

    // Check if payment microservice is enabled
    if (!paymentService.isEnabled()) {
      return res.status(503).json(error('Payment service is not available'));
    }

    // Prepare payment context
    const paymentContext = {
      orderType,
      relatedId,
      description,
      userId,
      timestamp: new Date().toISOString()
    };

    // Create order through payment microservice
    const paymentResponse = await paymentService.createOrder(userId, amount, currency, paymentContext);

    // Save order to local database
    const order = new Order({
      userId,
      paymentOrderId: paymentResponse.orderId,
      razorpayOrderId: paymentResponse.razorpayOrderId,
      amount,
      currency,
      status: 'created',
      paymentContext,
      metadata: {
        orderType,
        relatedId,
        description
      }
    });

    await order.save();

    logger.info('Order created successfully', { 
      userId, 
      orderId: order.id, 
      paymentOrderId: paymentResponse.orderId 
    });

    res.json(success({
      order: {
        id: order.id,
        paymentOrderId: paymentResponse.orderId,
        razorpayOrderId: paymentResponse.razorpayOrderId,
        amount,
        currency,
        status: order.status,
        createdAt: order.createdAt
      },
      razorpayKey: paymentResponse.razorpayKey,
      razorpayOrderId: paymentResponse.razorpayOrderId
    }, 'Order created successfully'));

  } catch (err) {
    logger.error('Order creation failed', { 
      userId: req.user?.id, 
      error: err.message 
    });
    res.status(500).json(error('Failed to create order', err.message));
  }
};

/**
 * Create a subscription
 */
const createSubscription = async (req, res) => {
  try {
    const { planType, description } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!planType || !['trial', 'monthly', 'yearly'].includes(planType)) {
      return res.status(400).json(error('Valid plan type is required (trial, monthly, yearly)'));
    }

    // Check if payment microservice is enabled
    if (!paymentService.isEnabled()) {
      return res.status(503).json(error('Payment service is not available'));
    }

    // Get plan details
    const plans = paymentService.getSubscriptionPlans();
    const selectedPlan = plans[planType];

    if (!selectedPlan || !selectedPlan.planId) {
      return res.status(400).json(error('Invalid plan type or plan not configured'));
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findActiveSubscription(userId);
    if (existingSubscription) {
      return res.status(400).json(error('User already has an active subscription'));
    }

    // Prepare payment context
    const paymentContext = {
      planType,
      planName: selectedPlan.name,
      description,
      userId,
      timestamp: new Date().toISOString()
    };

    // Create subscription through payment microservice
    const paymentResponse = await paymentService.createSubscription(userId, selectedPlan.planId, paymentContext);

    // Save subscription to local database
    const subscription = new Subscription({
      userId,
      paymentSubscriptionId: paymentResponse.subscriptionId,
      razorpaySubscriptionId: paymentResponse.razorpaySubscriptionId,
      planId: selectedPlan.planId,
      planName: selectedPlan.name,
      planType,
      amount: selectedPlan.amount,
      currency: 'INR',
      billingCycle: planType === 'yearly' ? 'yearly' : 'monthly',
      status: 'created',
      paymentContext,
      metadata: {
        description
      }
    });

    await subscription.save();

    logger.info('Subscription created successfully', { 
      userId, 
      subscriptionId: subscription.id, 
      paymentSubscriptionId: paymentResponse.subscriptionId 
    });

    res.json(success({
      subscription: {
        id: subscription.id,
        paymentSubscriptionId: paymentResponse.subscriptionId,
        razorpaySubscriptionId: paymentResponse.razorpaySubscriptionId,
        planType,
        planName: selectedPlan.name,
        amount: selectedPlan.amount,
        status: subscription.status,
        createdAt: subscription.createdAt
      },
      razorpayKey: paymentResponse.razorpayKey,
      razorpaySubscriptionId: paymentResponse.razorpaySubscriptionId
    }, 'Subscription created successfully'));

  } catch (err) {
    logger.error('Subscription creation failed', { 
      userId: req.user?.id, 
      error: err.message 
    });
    res.status(500).json(error('Failed to create subscription', err.message));
  }
};

/**
 * Get user orders
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const orders = await Order.findUserOrders(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      status 
    });

    const totalOrders = await Order.countDocuments({ 
      userId, 
      ...(status && { status }) 
    });

    res.json(success({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalOrders,
        pages: Math.ceil(totalOrders / parseInt(limit))
      }
    }, 'Orders retrieved successfully'));

  } catch (err) {
    logger.error('Get user orders failed', { 
      userId: req.user?.id, 
      error: err.message 
    });
    res.status(500).json(error('Failed to retrieve orders', err.message));
  }
};

/**
 * Get user subscriptions
 */
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, planType } = req.query;

    const subscriptions = await Subscription.findUserSubscriptions(userId, { 
      page: parseInt(page), 
      limit: parseInt(limit), 
      status,
      planType 
    });

    const totalSubscriptions = await Subscription.countDocuments({ 
      userId, 
      ...(status && { status }),
      ...(planType && { planType })
    });

    res.json(success({
      subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSubscriptions,
        pages: Math.ceil(totalSubscriptions / parseInt(limit))
      }
    }, 'Subscriptions retrieved successfully'));

  } catch (err) {
    logger.error('Get user subscriptions failed', { 
      userId: req.user?.id, 
      error: err.message 
    });
    res.status(500).json(error('Failed to retrieve subscriptions', err.message));
  }
};

/**
 * Get subscription plans
 */
const getSubscriptionPlans = async (req, res) => {
  try {
    if (!paymentService.isEnabled()) {
      return res.status(503).json(error('Payment service is not available'));
    }

    const plans = paymentService.getSubscriptionPlans();
    
    res.json(success({
      plans: Object.values(plans).map(plan => ({
        planId: plan.planId,
        name: plan.name,
        amount: plan.amount,
        duration: plan.duration,
        description: plan.description,
        type: Object.keys(plans).find(key => plans[key] === plan)
      }))
    }, 'Subscription plans retrieved successfully'));

  } catch (err) {
    logger.error('Get subscription plans failed', { error: err.message });
    res.status(500).json(error('Failed to retrieve subscription plans', err.message));
  }
};

/**
 * Verify payment
 */
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json(error('Missing required payment verification data'));
    }

    // Check if payment microservice is enabled
    if (!paymentService.isEnabled()) {
      return res.status(503).json(error('Payment service is not available'));
    }

    // Verify payment through payment microservice
    const verificationData = {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    };

    const verificationResponse = await paymentService.verifyPayment(userId, verificationData);

    if (verificationResponse.success) {
      // Find and update the order
      const order = await Order.findByRazorpayOrderId(razorpay_order_id);
      if (order) {
        await order.markAsPaid(razorpay_payment_id);
        logger.info('Order payment verified and updated', { 
          userId, 
          orderId: order.id, 
          razorpayPaymentId: razorpay_payment_id 
        });
      }

      res.json(success({
        verified: true,
        orderId: order?.id,
        paymentId: razorpay_payment_id
      }, 'Payment verified successfully'));
    } else {
      res.status(400).json(error('Payment verification failed'));
    }

  } catch (err) {
    logger.error('Payment verification failed', { 
      userId: req.user?.id, 
      error: err.message 
    });
    res.status(500).json(error('Failed to verify payment', err.message));
  }
};

/**
 * Handle payment callback from payment microservice
 */
const handlePaymentCallback = async (req, res) => {
  try {
    const {
      userId,
      orderId,
      subscriptionId,
      razorpayOrderId,
      razorpaySubscriptionId,
      razorpayPaymentId,
      status,
      paymentContext
    } = req.body;

    logger.info('Payment callback received', {
      userId,
      orderId,
      subscriptionId,
      razorpayOrderId,
      razorpaySubscriptionId,
      razorpayPaymentId,
      status,
      paymentContext
    });

    // Handle order payment callback
    if (orderId) {
      const order = await Order.findByPaymentOrderId(orderId);
      if (order) {
        if (status === 'paid') {
          await order.markAsPaid(razorpayPaymentId);
          logger.info('Order marked as paid', { orderId: order.id, userId });
        } else if (status === 'failed') {
          await order.markAsFailed();
          logger.info('Order marked as failed', { orderId: order.id, userId });
        }
      } else {
        logger.warn('Order not found for callback', { orderId, userId });
      }
    }

    // Handle subscription payment callback
    if (subscriptionId) {
      const subscription = await Subscription.findByPaymentSubscriptionId(subscriptionId);
      if (subscription) {
        if (status === 'active') {
          // Calculate subscription dates based on plan type
          const startDate = new Date();
          let endDate = new Date();

          switch (subscription.planType) {
            case 'trial':
              endDate.setDate(endDate.getDate() + 7);
              subscription.trialStart = startDate;
              subscription.trialEnd = endDate;
              break;
            case 'monthly':
              endDate.setMonth(endDate.getMonth() + 1);
              break;
            case 'yearly':
              endDate.setFullYear(endDate.getFullYear() + 1);
              break;
          }

          await subscription.activate(startDate, endDate);

          // Update user's subscription status
          await User.findByIdAndUpdate(userId, {
            'subscription.isActive': true,
            'subscription.planType': subscription.planType,
            'subscription.subscriptionId': subscription.id,
            'subscription.startDate': startDate,
            'subscription.endDate': endDate
          });

          logger.info('Subscription activated', {
            subscriptionId: subscription.id,
            userId,
            planType: subscription.planType
          });
        } else if (status === 'cancelled' || status === 'expired') {
          await subscription.cancel('Payment callback', userId);

          // Update user's subscription status
          await User.findByIdAndUpdate(userId, {
            'subscription.isActive': false,
            'subscription.planType': null,
            'subscription.subscriptionId': null
          });

          logger.info('Subscription cancelled/expired', {
            subscriptionId: subscription.id,
            userId,
            status
          });
        }
      } else {
        logger.warn('Subscription not found for callback', { subscriptionId, userId });
      }
    }

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (err) {
    logger.error('Callback processing failed', {
      error: err.message,
      body: req.body
    });
    res.status(500).json({
      success: false,
      error: 'Callback processing failed'
    });
  }
};

/**
 * Get payment service status
 */
const getPaymentServiceStatus = async (req, res) => {
  try {
    const isEnabled = paymentService.isEnabled();

    res.json(success({
      enabled: isEnabled,
      microserviceUrl: isEnabled ? process.env.PAYMENT_MICROSERVICE_URL : null,
      packageId: isEnabled ? process.env.PAYMENT_PACKAGE_ID : null
    }, 'Payment service status retrieved'));

  } catch (err) {
    logger.error('Get payment service status failed', { error: err.message });
    res.status(500).json(error('Failed to get payment service status', err.message));
  }
};

module.exports = {
  createOrder,
  createSubscription,
  getUserOrders,
  getUserSubscriptions,
  getSubscriptionPlans,
  verifyPayment,
  handlePaymentCallback,
  getPaymentServiceStatus
};
