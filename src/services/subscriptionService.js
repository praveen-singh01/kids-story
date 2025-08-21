const userRepository = require('../repositories/userRepository');
const { PaymentEvent } = require('../models');
const paymentsClient = require('../utils/clients/paymentsClient');
const { cache } = require('../loaders/redisLoader');
const logger = require('../utils/logger');

class SubscriptionService {
  /**
   * Get user's subscription details
   */
  async getUserSubscription(userId) {
    const user = await userRepository.findWithSubscription(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return {
      plan: user.subscription.plan,
      status: user.subscription.status,
      currentPeriodEnd: user.subscription.currentPeriodEnd,
      provider: user.subscription.provider,
      updatedAt: user.subscription.updatedAt,
    };
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckoutSession(userId, plan, successUrl, cancelUrl) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate plan
    const validPlans = ['premium', 'family'];
    if (!validPlans.includes(plan)) {
      throw new Error('Invalid subscription plan');
    }
    
    try {
      // Call payments service to create checkout session
      const response = await paymentsClient.post('/checkout', {
        userId,
        userEmail: user.email,
        plan,
        successUrl,
        cancelUrl,
        metadata: {
          userId,
          plan,
        },
      });
      
      logger.info({ userId, plan }, 'Checkout session created');
      
      return response.data;
    } catch (error) {
      logger.error({ 
        error: error.message, 
        userId, 
        plan,
        status: error.response?.status,
        data: error.response?.data 
      }, 'Failed to create checkout session');
      
      throw new Error('Failed to create checkout session');
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    const user = await userRepository.findWithSubscription(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.subscription.status !== 'active') {
      throw new Error('No active subscription to cancel');
    }
    
    try {
      // Call payments service to cancel subscription
      const response = await paymentsClient.post('/cancel', {
        userId,
        providerRef: user.subscription.providerRef,
      });
      
      // Update local subscription status
      await userRepository.updateSubscription(userId, {
        status: 'cancelled',
        plan: user.subscription.plan, // Keep the plan for grace period
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        provider: user.subscription.provider,
        providerRef: user.subscription.providerRef,
      });
      
      // Invalidate user cache
      await cache.del(`user:${userId}`);
      
      logger.info({ userId }, 'Subscription cancelled');
      
      return response.data;
    } catch (error) {
      logger.error({ 
        error: error.message, 
        userId,
        status: error.response?.status,
        data: error.response?.data 
      }, 'Failed to cancel subscription');
      
      throw new Error('Failed to cancel subscription');
    }
  }

  /**
   * Process payment event from payments service
   */
  async processPaymentEvent(eventId, eventType, userId, eventData) {
    try {
      // Create payment event record (idempotent)
      const paymentEvent = await PaymentEvent.createEvent(eventId, eventType, userId, eventData);
      
      // Process the event
      await this.handlePaymentEvent(paymentEvent);
      
      // Mark as processed
      await paymentEvent.markProcessed();
      
      logger.info({ eventId, eventType, userId }, 'Payment event processed successfully');
      
      return true;
    } catch (error) {
      logger.error({ 
        error: error.message, 
        eventId, 
        eventType, 
        userId 
      }, 'Failed to process payment event');
      
      // Mark as failed if event exists
      const paymentEvent = await PaymentEvent.findOne({ eventId });
      if (paymentEvent) {
        await paymentEvent.markFailed(error.message);
      }
      
      throw error;
    }
  }

  /**
   * Handle specific payment event types
   */
  async handlePaymentEvent(paymentEvent) {
    const { type, userId, data } = paymentEvent;
    
    switch (type) {
      case 'subscription.created':
        await this.handleSubscriptionCreated(userId, data);
        break;
        
      case 'subscription.updated':
        await this.handleSubscriptionUpdated(userId, data);
        break;
        
      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(userId, data);
        break;
        
      case 'subscription.renewed':
        await this.handleSubscriptionRenewed(userId, data);
        break;
        
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(userId, data);
        break;
        
      case 'payment.failed':
        await this.handlePaymentFailed(userId, data);
        break;
        
      default:
        logger.warn({ type, userId }, 'Unknown payment event type');
    }
  }

  /**
   * Handle subscription created event
   */
  async handleSubscriptionCreated(userId, data) {
    const { plan, status, currentPeriodEnd, provider, providerRef } = data;
    
    await userRepository.updateSubscription(userId, {
      plan,
      status,
      currentPeriodEnd: new Date(currentPeriodEnd),
      provider,
      providerRef,
    });
    
    // Invalidate user cache
    await cache.del(`user:${userId}`);
    
    logger.info({ userId, plan, status }, 'Subscription created');
  }

  /**
   * Handle subscription updated event
   */
  async handleSubscriptionUpdated(userId, data) {
    const { plan, status, currentPeriodEnd, provider, providerRef } = data;
    
    await userRepository.updateSubscription(userId, {
      plan,
      status,
      currentPeriodEnd: new Date(currentPeriodEnd),
      provider,
      providerRef,
    });
    
    // Invalidate user cache
    await cache.del(`user:${userId}`);
    
    logger.info({ userId, plan, status }, 'Subscription updated');
  }

  /**
   * Handle subscription cancelled event
   */
  async handleSubscriptionCancelled(userId, data) {
    const { currentPeriodEnd } = data;
    
    const user = await userRepository.findWithSubscription(userId);
    if (user) {
      await userRepository.updateSubscription(userId, {
        plan: user.subscription.plan,
        status: 'cancelled',
        currentPeriodEnd: new Date(currentPeriodEnd),
        provider: user.subscription.provider,
        providerRef: user.subscription.providerRef,
      });
    }
    
    // Invalidate user cache
    await cache.del(`user:${userId}`);
    
    logger.info({ userId }, 'Subscription cancelled');
  }

  /**
   * Handle subscription renewed event
   */
  async handleSubscriptionRenewed(userId, data) {
    const { plan, currentPeriodEnd } = data;
    
    const user = await userRepository.findWithSubscription(userId);
    if (user) {
      await userRepository.updateSubscription(userId, {
        plan,
        status: 'active',
        currentPeriodEnd: new Date(currentPeriodEnd),
        provider: user.subscription.provider,
        providerRef: user.subscription.providerRef,
      });
    }
    
    // Invalidate user cache
    await cache.del(`user:${userId}`);
    
    logger.info({ userId, plan }, 'Subscription renewed');
  }

  /**
   * Handle payment succeeded event
   */
  async handlePaymentSucceeded(userId, data) {
    // Could be used for analytics, notifications, etc.
    logger.info({ userId, amount: data.amount }, 'Payment succeeded');
  }

  /**
   * Handle payment failed event
   */
  async handlePaymentFailed(userId, data) {
    // Could be used for notifications, retry logic, etc.
    logger.warn({ userId, reason: data.reason }, 'Payment failed');
  }

  /**
   * Get subscription statistics
   */
  async getSubscriptionStats() {
    const activeSubscriptions = await userRepository.findBySubscriptionStatus('active');
    const cancelledSubscriptions = await userRepository.findBySubscriptionStatus('cancelled');
    
    return {
      active: activeSubscriptions.length,
      cancelled: cancelledSubscriptions.length,
      total: activeSubscriptions.length + cancelledSubscriptions.length,
    };
  }
}

module.exports = new SubscriptionService();
