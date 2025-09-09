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
      // Ensure paymentContext has required metadata with proper phone format
      const enhancedPaymentContext = {
        ...paymentContext,
        metadata: {
          ...paymentContext.metadata,
          // Ensure phone number is in correct format (10 digits starting with 6-9)
          userPhone: this.formatPhoneNumber(paymentContext.metadata?.userPhone)
        }
      };

      const response = await axios.post(`${this.baseUrl}/api/payment/subscription`, {
        userId,
        planId,
        paymentContext: enhancedPaymentContext
      }, {
        headers: this.getHeaders(userId)
      });

      logger.info(`Subscription created for user ${userId}: ${response.data.data.subscriptionId}`);
      return response.data.data; // Return the data object directly
    } catch (error) {
      logger.error('Subscription creation failed:');
      logger.error('Status:', error.response?.status);
      logger.error('Data:', JSON.stringify(error.response?.data, null, 2));
      logger.error('Headers:', error.response?.headers);
      logger.error('Request URL:', error.config?.url);
      logger.error('Request Data:', JSON.stringify(error.config?.data, null, 2));
      throw error;
    }
  }

  /**
   * Format phone number to meet payment microservice requirements
   * @param {string} phone - Phone number in any format
   * @returns {string} - Formatted phone number (10 digits starting with 6-9)
   */
  formatPhoneNumber(phone) {
    if (!phone) {
      // Generate a default valid phone number for testing
      return '9999999999';
    }

    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // If it's 11 digits starting with 91 (India country code), remove the 91
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return cleanPhone.substring(2);
    }

    // If it's 10 digits and starts with 6-9, return as is
    if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
      return cleanPhone;
    }

    // If it's not in correct format, return a default valid number
    logger.warn(`Invalid phone number format: ${phone}, using default`);
    return '9999999999';
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
