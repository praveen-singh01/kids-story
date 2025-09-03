const axios = require('axios');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Payment Service - Interface for external payment microservice
 * This service handles communication with the external payment processing system
 */
class PaymentService {
  constructor() {
    this.paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3001';
    this.paymentServiceApiKey = process.env.PAYMENT_SERVICE_API_KEY;
    
    // Configure axios instance for payment service
    this.paymentClient = axios.create({
      baseURL: this.paymentServiceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.paymentServiceApiKey}`,
        'X-Service': 'kids-story-api'
      }
    });

    // Add request/response interceptors for logging
    this.paymentClient.interceptors.request.use(
      (config) => {
        logger.info('Payment service request:', {
          method: config.method,
          url: config.url,
          data: config.data ? 'present' : 'none'
        });
        return config;
      },
      (error) => {
        logger.error('Payment service request error:', error);
        return Promise.reject(error);
      }
    );

    this.paymentClient.interceptors.response.use(
      (response) => {
        logger.info('Payment service response:', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        logger.error('Payment service response error:', {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(userId, planId, paymentMethodId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const response = await this.paymentClient.post('/subscriptions', {
        userId,
        userEmail: user.email,
        planId,
        paymentMethodId,
        metadata: {
          service: 'kids-story-app',
          userProvider: user.provider
        }
      });

      const subscription = response.data;

      // Update user subscription in our database
      await this.updateUserSubscription(userId, {
        plan: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        provider: 'stripe',
        providerRef: subscription.id
      });

      logger.info(`Subscription created for user ${userId}: ${subscription.id}`);

      return subscription;
    } catch (error) {
      logger.error('Create subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription?.providerRef) {
        throw new Error('No active subscription found');
      }

      const response = await this.paymentClient.post(`/subscriptions/${user.subscription.providerRef}/cancel`);
      const subscription = response.data;

      // Update user subscription status
      await this.updateUserSubscription(userId, {
        status: 'cancelled',
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      });

      logger.info(`Subscription cancelled for user ${userId}: ${subscription.id}`);

      return subscription;
    } catch (error) {
      logger.error('Cancel subscription error:', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Update subscription (change plan, payment method, etc.)
   */
  async updateSubscription(userId, updates) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription?.providerRef) {
        throw new Error('No active subscription found');
      }

      const response = await this.paymentClient.patch(`/subscriptions/${user.subscription.providerRef}`, updates);
      const subscription = response.data;

      // Update user subscription in our database
      await this.updateUserSubscription(userId, {
        plan: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      });

      logger.info(`Subscription updated for user ${userId}: ${subscription.id}`);

      return subscription;
    } catch (error) {
      logger.error('Update subscription error:', error);
      throw new Error('Failed to update subscription');
    }
  }

  /**
   * Get subscription details from payment service
   */
  async getSubscription(userId) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.subscription?.providerRef) {
        return null;
      }

      const response = await this.paymentClient.get(`/subscriptions/${user.subscription.providerRef}`);
      return response.data;
    } catch (error) {
      logger.error('Get subscription error:', error);
      return null;
    }
  }

  /**
   * Handle webhook from payment service
   */
  async handleWebhook(event) {
    try {
      logger.info('Processing payment webhook:', { type: event.type, id: event.id });

      switch (event.type) {
        case 'subscription.created':
          await this.handleSubscriptionCreated(event.data);
          break;
        case 'subscription.updated':
          await this.handleSubscriptionUpdated(event.data);
          break;
        case 'subscription.cancelled':
          await this.handleSubscriptionCancelled(event.data);
          break;
        case 'payment.succeeded':
          await this.handlePaymentSucceeded(event.data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.data);
          break;
        default:
          logger.warn('Unhandled webhook event type:', event.type);
      }

      return { processed: true };
    } catch (error) {
      logger.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Update user subscription in our database
   */
  async updateUserSubscription(userId, subscriptionData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.subscription = {
        ...user.subscription,
        ...subscriptionData
      };

      await user.save();
      return user;
    } catch (error) {
      logger.error('Update user subscription error:', error);
      throw error;
    }
  }

  // Webhook event handlers
  async handleSubscriptionCreated(subscription) {
    // Find user by provider reference or email
    const user = await User.findOne({
      $or: [
        { 'subscription.providerRef': subscription.id },
        { email: subscription.customerEmail }
      ]
    });

    if (user) {
      await this.updateUserSubscription(user._id, {
        plan: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.currentPeriodEnd),
        provider: 'stripe',
        providerRef: subscription.id
      });
    }
  }

  async handleSubscriptionUpdated(subscription) {
    const user = await User.findOne({ 'subscription.providerRef': subscription.id });
    if (user) {
      await this.updateUserSubscription(user._id, {
        plan: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      });
    }
  }

  async handleSubscriptionCancelled(subscription) {
    const user = await User.findOne({ 'subscription.providerRef': subscription.id });
    if (user) {
      await this.updateUserSubscription(user._id, {
        status: 'cancelled',
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      });
    }
  }

  async handlePaymentSucceeded(payment) {
    logger.info('Payment succeeded:', { subscriptionId: payment.subscriptionId, amount: payment.amount });
    // Could trigger email notifications, analytics events, etc.
  }

  async handlePaymentFailed(payment) {
    logger.warn('Payment failed:', { subscriptionId: payment.subscriptionId, reason: payment.failureReason });
    // Could trigger retry logic, email notifications, etc.
  }
}

module.exports = new PaymentService();
