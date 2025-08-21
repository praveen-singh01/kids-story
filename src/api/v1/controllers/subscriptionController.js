const { subscriptionService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class SubscriptionController {
  /**
   * Get user's subscription details
   */
  async getSubscription(req, res, next) {
    try {
      const userId = req.userId;
      
      const subscription = await subscriptionService.getUserSubscription(userId);
      
      res.json(success(subscription, 'Subscription retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create checkout session
   */
  async createCheckout(req, res, next) {
    try {
      const userId = req.userId;
      const { plan, successUrl, cancelUrl } = req.body;
      
      const checkoutSession = await subscriptionService.createCheckoutSession(
        userId, 
        plan, 
        successUrl, 
        cancelUrl
      );
      
      res.json(success(checkoutSession, 'Checkout session created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req, res, next) {
    try {
      const userId = req.userId;
      
      const result = await subscriptionService.cancelSubscription(userId);
      
      res.json(success(result, 'Subscription cancelled successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Process payment event (M2M endpoint)
   */
  async processPaymentEvent(req, res, next) {
    try {
      const { eventId, type, userId, data } = req.body;
      
      await subscriptionService.processPaymentEvent(eventId, type, userId, data);
      
      res.json(success(null, 'Payment event processed successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get subscription statistics (admin only)
   */
  async getSubscriptionStats(req, res, next) {
    try {
      const stats = await subscriptionService.getSubscriptionStats();
      
      res.json(success(stats, 'Subscription statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SubscriptionController();
