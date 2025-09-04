const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Payment Microservice Client - Interface for Kids Story payment microservice integration
 * This service handles communication with the payment microservice following the integration guide
 */
class PaymentServiceClient {
  constructor() {
    this.baseUrl = process.env.PAYMENT_MICROSERVICE_URL;
    this.packageId = process.env.PAYMENT_PACKAGE_ID;
    this.jwtSecret = process.env.PAYMENT_JWT_SECRET;

    if (!this.baseUrl || !this.packageId || !this.jwtSecret) {
      logger.error('Payment microservice configuration missing:', {
        baseUrl: !!this.baseUrl,
        packageId: !!this.packageId,
        jwtSecret: !!this.jwtSecret
      });
      throw new Error('Payment microservice configuration is incomplete');
    }
  }

  /**
   * Generate JWT token for API calls
   */
  generateToken(userId) {
    const payload = {
      userId: userId,
      appId: this.packageId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiry
    };
    return jwt.sign(payload, this.jwtSecret);
  }

  /**
   * Get headers for API requests
   */
  getHeaders(userId) {
    return {
      'Authorization': `Bearer ${this.generateToken(userId)}`,
      'x-app-id': this.packageId,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Create an order for one-time payment
   */
  async createOrder(userId, amount, currency = 'INR', paymentContext = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/order`, {
        userId,
        amount, // Amount in paise
        currency,
        paymentContext
      }, {
        headers: this.getHeaders(userId)
      });

      logger.info(`Order created for user ${userId}: ${response.data.orderId}`);
      return response.data;
    } catch (error) {
      logger.error('Order creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a subscription for a user
   */
  async createSubscription(userId, planId, paymentContext = {}) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/subscription`, {
        userId,
        planId,
        paymentContext
      }, {
        headers: this.getHeaders(userId)
      });

      logger.info(`Subscription created for user ${userId}: ${response.data.subscriptionId}`);
      return response.data;
    } catch (error) {
      logger.error('Subscription creation failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user orders
   */
  async getUserOrders(userId, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/payment/orders`, {
        params: { page, limit },
        headers: this.getHeaders(userId)
      });

      logger.info(`Retrieved orders for user ${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Get orders failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId, page = 1, limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/payment/subscriptions`, {
        params: { page, limit },
        headers: this.getHeaders(userId)
      });

      logger.info(`Retrieved subscriptions for user ${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Get subscriptions failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verify payment success
   */
  async verifyPayment(userId, verificationData) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/payment/verify-success`,
        verificationData,
        {
          headers: this.getHeaders(userId)
        }
      );

      logger.info(`Payment verification completed for user ${userId}`);
      return response.data;
    } catch (error) {
      logger.error('Payment verification failed:', error.response?.data || error.message);
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
      logger.info(`User subscription updated for user ${userId}`);
      return user;
    } catch (error) {
      logger.error('Update user subscription error:', error);
      throw error;
    }
  }

  /**
   * Update order status in our database
   */
  async updateOrderStatus(orderId, status) {
    try {
      // This would typically update an Order model if you have one
      // For now, just log the status update
      logger.info(`Order ${orderId} status updated to: ${status}`);
      return { orderId, status };
    } catch (error) {
      logger.error('Update order status error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentServiceClient();
