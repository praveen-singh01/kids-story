const axios = require('axios');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class PaymentServiceClient {
  constructor() {
    this.baseUrl = process.env.PAYMENT_MICROSERVICE_URL;
    this.packageId = process.env.PAYMENT_PACKAGE_ID;
    this.jwtSecret = process.env.PAYMENT_JWT_SECRET;
    this.usePaymentMicroservice = process.env.USE_PAYMENT_MICROSERVICE === 'true';
    
    if (this.usePaymentMicroservice && (!this.baseUrl || !this.packageId || !this.jwtSecret)) {
      throw new Error('Payment microservice configuration is incomplete. Check environment variables.');
    }
  }

  /**
   * Generate JWT token for payment microservice authentication
   * @param {string} userId - User ID
   * @returns {string} JWT token
   */
  generateToken(userId) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    const payload = {
      userId: userId,
      appId: this.packageId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
    };
    
    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Get headers for payment microservice API calls
   * @param {string} userId - User ID
   * @returns {object} Headers object
   */
  getHeaders(userId) {
    return {
      'Authorization': `Bearer ${this.generateToken(userId)}`,
      'x-app-id': this.packageId,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create a payment order
   * @param {string} userId - User ID
   * @param {number} amount - Amount in paise
   * @param {string} currency - Currency code (default: INR)
   * @param {object} paymentContext - Additional context data
   * @returns {Promise<object>} Order creation response
   */
  async createOrder(userId, amount, currency = 'INR', paymentContext = {}) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    try {
      logger.info('Creating payment order', { userId, amount, currency, paymentContext });
      
      const response = await axios.post(`${this.baseUrl}/api/payment/order`, {
        userId,
        amount, // Amount in paise
        currency,
        paymentContext
      }, {
        headers: this.getHeaders(userId),
        timeout: 30000 // 30 seconds timeout
      });
      
      logger.info('Payment order created successfully', { 
        userId, 
        orderId: response.data.orderId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Order creation failed', { 
        userId, 
        amount, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Order creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a subscription
   * @param {string} userId - User ID
   * @param {string} planId - Razorpay plan ID
   * @param {object} paymentContext - Additional context data
   * @returns {Promise<object>} Subscription creation response
   */
  async createSubscription(userId, planId, paymentContext = {}) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    try {
      logger.info('Creating subscription', { userId, planId, paymentContext });
      
      const response = await axios.post(`${this.baseUrl}/api/payment/subscription`, {
        userId,
        planId,
        paymentContext
      }, {
        headers: this.getHeaders(userId),
        timeout: 30000 // 30 seconds timeout
      });
      
      logger.info('Subscription created successfully', { 
        userId, 
        subscriptionId: response.data.subscriptionId 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Subscription creation failed', { 
        userId, 
        planId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Subscription creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user orders
   * @param {string} userId - User ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<object>} User orders response
   */
  async getUserOrders(userId, page = 1, limit = 10) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    try {
      logger.info('Fetching user orders', { userId, page, limit });
      
      const response = await axios.get(`${this.baseUrl}/api/payment/orders`, {
        params: { page, limit },
        headers: this.getHeaders(userId),
        timeout: 30000 // 30 seconds timeout
      });
      
      logger.info('User orders fetched successfully', { 
        userId, 
        ordersCount: response.data.orders?.length || 0 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Get orders failed', { 
        userId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Get orders failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user subscriptions
   * @param {string} userId - User ID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<object>} User subscriptions response
   */
  async getUserSubscriptions(userId, page = 1, limit = 10) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    try {
      logger.info('Fetching user subscriptions', { userId, page, limit });
      
      const response = await axios.get(`${this.baseUrl}/api/payment/subscriptions`, {
        params: { page, limit },
        headers: this.getHeaders(userId),
        timeout: 30000 // 30 seconds timeout
      });
      
      logger.info('User subscriptions fetched successfully', { 
        userId, 
        subscriptionsCount: response.data.subscriptions?.length || 0 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Get subscriptions failed', { 
        userId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Get subscriptions failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify payment success
   * @param {string} userId - User ID
   * @param {object} verificationData - Payment verification data
   * @returns {Promise<object>} Payment verification response
   */
  async verifyPayment(userId, verificationData) {
    if (!this.usePaymentMicroservice) {
      throw new Error('Payment microservice is not enabled');
    }

    try {
      logger.info('Verifying payment', { userId, verificationData });
      
      const response = await axios.post(`${this.baseUrl}/api/payment/verify-success`, 
        verificationData, 
        {
          headers: this.getHeaders(userId),
          timeout: 30000 // 30 seconds timeout
        }
      );
      
      logger.info('Payment verification successful', { 
        userId, 
        verified: response.data.success 
      });
      
      return response.data;
    } catch (error) {
      logger.error('Payment verification failed', { 
        userId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Payment verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Check if payment microservice is enabled
   * @returns {boolean} Whether payment microservice is enabled
   */
  isEnabled() {
    return this.usePaymentMicroservice;
  }

  /**
   * Get available subscription plans
   * @returns {object} Available subscription plans
   */
  getSubscriptionPlans() {
    return {
      trial: {
        planId: process.env.RAZORPAY_TRIAL_PLAN_ID,
        name: 'Trial Plan',
        amount: 100, // ₹1 in paise
        duration: '7 days',
        description: '7-day trial access to all content'
      },
      monthly: {
        planId: process.env.RAZORPAY_MONTHLY_PLAN_ID,
        name: 'Monthly Plan',
        amount: 9900, // ₹99 in paise
        duration: '1 month',
        description: 'Monthly subscription with full access'
      },
      yearly: {
        planId: process.env.RAZORPAY_YEARLY_PLAN_ID,
        name: 'Yearly Plan',
        amount: 49900, // ₹499 in paise
        duration: '1 year',
        description: 'Yearly subscription with full access and savings'
      }
    };
  }
}

module.exports = PaymentServiceClient;
