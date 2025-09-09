const express = require('express');
const { query, param, body } = require('express-validator');
const { User } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const paymentService = require('../../services/paymentService');
const logger = require('../../config/logger');

const router = express.Router();

// Validation rules
const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['created', 'paid', 'failed', 'cancelled']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
];

// GET /admin/payment/stats - Get payment statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_PAYMENT_STATS'),
  async (req, res) => {
    try {
      // Since we don't have direct access to payment data, we'll provide subscription-based stats
      const totalUsers = await User.countDocuments();
      const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
      const freeUsers = totalUsers - premiumUsers;
      
      // Calculate subscription metrics
      const subscriptionRate = totalUsers > 0 ? (premiumUsers / totalUsers * 100) : 0;
      
      // Get subscription distribution by status
      const activeSubscriptions = await User.countDocuments({ 
        'subscription.plan': 'premium',
        'subscription.status': 'active'
      });
      
      const cancelledSubscriptions = await User.countDocuments({ 
        'subscription.plan': 'premium',
        'subscription.status': 'cancelled'
      });

      // Mock revenue data (would come from payment microservice in real implementation)
      const mockRevenueData = {
        totalRevenue: premiumUsers * 9900, // Assuming ₹99 per subscription
        monthlyRevenue: Math.floor(premiumUsers * 9900 * 0.3), // Mock monthly revenue
        averageOrderValue: 9900,
        revenueGrowth: 15.2 // Mock growth percentage
      };

      const paymentStats = {
        subscriptions: {
          total: premiumUsers,
          active: activeSubscriptions,
          cancelled: cancelledSubscriptions,
          subscriptionRate: parseFloat(subscriptionRate.toFixed(1))
        },
        users: {
          total: totalUsers,
          premium: premiumUsers,
          free: freeUsers
        },
        revenue: mockRevenueData
      };

      res.success(paymentStats, 'Payment statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get payment stats error:', error);
      res.status(500).error(['Failed to retrieve payment statistics'], 'Internal server error');
    }
  }
);

// GET /admin/payment/orders - List all payment orders (mock implementation)
router.get('/orders',
  adminAuth,
  logAdminAction('LIST_PAYMENT_ORDERS'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        dateFrom,
        dateTo
      } = req.query;

      // Since we don't have direct access to payment orders, we'll create mock data
      // In a real implementation, this would call the payment microservice
      
      // Get users with premium subscriptions as a proxy for orders
      let filter = { 'subscription.plan': 'premium' };
      
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;
      
      const users = await User.find(filter)
        .select('name email subscription createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalOrders = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalOrders / limit);

      // Transform users to mock order format
      const mockOrders = users.map((user, index) => ({
        id: `order_${user._id}`,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        amount: 9900, // ₹99 in paise
        currency: 'INR',
        status: user.subscription.status === 'active' ? 'paid' : 'failed',
        planType: 'premium',
        createdAt: user.createdAt,
        razorpayOrderId: `order_razorpay_${user._id.toString().slice(-6)}`
      }));

      const response = {
        orders: mockOrders,
        pagination: {
          currentPage: page,
          totalPages,
          totalOrders,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      res.success(response, 'Payment orders retrieved successfully');

    } catch (error) {
      logger.error('Admin get payment orders error:', error);
      res.status(500).error(['Failed to retrieve payment orders'], 'Internal server error');
    }
  }
);

// GET /admin/payment/orders/:id - Get specific order details
router.get('/orders/:id',
  adminAuth,
  logAdminAction('GET_ORDER_DETAILS'),
  [param('id').notEmpty().withMessage('Order ID is required')],
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Extract user ID from mock order ID format
      const userId = id.replace('order_', '');
      
      const user = await User.findById(userId)
        .select('name email subscription createdAt lastLoginAt')
        .lean();

      if (!user) {
        return res.status(404).error(['Order not found'], 'Order not found');
      }

      // Mock order details
      const orderDetails = {
        id: `order_${user._id}`,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        amount: 9900,
        currency: 'INR',
        status: user.subscription.status === 'active' ? 'paid' : 'failed',
        planType: 'premium',
        createdAt: user.createdAt,
        razorpayOrderId: `order_razorpay_${user._id.toString().slice(-6)}`,
        paymentMethod: 'card', // Mock data
        transactionId: `txn_${user._id.toString().slice(-8)}`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          lastLoginAt: user.lastLoginAt,
          subscription: user.subscription
        }
      };

      res.success(orderDetails, 'Order details retrieved successfully');

    } catch (error) {
      logger.error('Admin get order details error:', error);
      res.status(500).error(['Failed to retrieve order details'], 'Internal server error');
    }
  }
);

// GET /admin/payment/subscriptions - List all subscriptions
router.get('/subscriptions',
  adminAuth,
  logAdminAction('LIST_SUBSCRIPTIONS'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        plan
      } = req.query;

      // Build filter
      let filter = {};
      
      if (status) {
        filter['subscription.status'] = status;
      }
      
      if (plan) {
        filter['subscription.plan'] = plan;
      } else {
        // Only show users with premium subscriptions
        filter['subscription.plan'] = 'premium';
      }

      const skip = (page - 1) * limit;
      
      const users = await User.find(filter)
        .select('name email subscription createdAt lastLoginAt')
        .sort({ 'subscription.currentPeriodEnd': -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalSubscriptions = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalSubscriptions / limit);

      // Transform to subscription format
      const subscriptions = users.map(user => ({
        id: `sub_${user._id}`,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        createdAt: user.createdAt,
        provider: user.subscription.provider || 'razorpay',
        providerRef: user.subscription.providerRef
      }));

      const response = {
        subscriptions,
        pagination: {
          currentPage: page,
          totalPages,
          totalSubscriptions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      res.success(response, 'Subscriptions retrieved successfully');

    } catch (error) {
      logger.error('Admin get subscriptions error:', error);
      res.status(500).error(['Failed to retrieve subscriptions'], 'Internal server error');
    }
  }
);

// GET /admin/payment/subscriptions/:id - Get specific subscription details
router.get('/subscriptions/:id',
  adminAuth,
  logAdminAction('GET_SUBSCRIPTION_DETAILS'),
  [param('id').notEmpty().withMessage('Subscription ID is required')],
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Extract user ID from mock subscription ID format
      const userId = id.replace('sub_', '');
      
      const user = await User.findById(userId)
        .select('name email subscription createdAt lastLoginAt')
        .lean();

      if (!user) {
        return res.status(404).error(['Subscription not found'], 'Subscription not found');
      }

      const subscriptionDetails = {
        id: `sub_${user._id}`,
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        plan: user.subscription.plan,
        status: user.subscription.status,
        currentPeriodEnd: user.subscription.currentPeriodEnd,
        createdAt: user.createdAt,
        provider: user.subscription.provider || 'razorpay',
        providerRef: user.subscription.providerRef,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      };

      res.success(subscriptionDetails, 'Subscription details retrieved successfully');

    } catch (error) {
      logger.error('Admin get subscription details error:', error);
      res.status(500).error(['Failed to retrieve subscription details'], 'Internal server error');
    }
  }
);

// POST /admin/payment/subscriptions/:id/cancel - Cancel subscription
router.post('/subscriptions/:id/cancel',
  adminAuth,
  logAdminAction('CANCEL_SUBSCRIPTION'),
  [param('id').notEmpty().withMessage('Subscription ID is required')],
  async (req, res) => {
    try {
      const { id } = req.params;
      
      // Extract user ID from mock subscription ID format
      const userId = id.replace('sub_', '');
      
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          'subscription.status': 'cancelled',
          'subscription.currentPeriodEnd': new Date()
        },
        { new: true }
      ).select('name email subscription');

      if (!user) {
        return res.status(404).error(['Subscription not found'], 'Subscription not found');
      }

      logger.info(`Subscription cancelled by admin ${req.userId} for user ${userId}`);

      res.success({
        id: `sub_${user._id}`,
        status: 'cancelled',
        cancelledAt: new Date(),
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }, 'Subscription cancelled successfully');

    } catch (error) {
      logger.error('Admin cancel subscription error:', error);
      res.status(500).error(['Failed to cancel subscription'], 'Internal server error');
    }
  }
);

// GET /admin/payment/analytics/revenue - Get revenue analytics
router.get('/analytics/revenue',
  adminAuth,
  logAdminAction('GET_REVENUE_ANALYTICS'),
  validateAdminRequest([
    query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']),
    query('groupBy').optional().isIn(['day', 'week', 'month'])
  ]),
  async (req, res) => {
    try {
      const { timeRange = '30d', groupBy = 'day' } = req.query;
      
      // Mock revenue analytics data
      // In a real implementation, this would query the payment microservice
      const mockRevenueData = [
        { period: '2024-01-01', revenue: 12000, orders: 12 },
        { period: '2024-01-02', revenue: 15000, orders: 15 },
        { period: '2024-01-03', revenue: 18000, orders: 18 },
        { period: '2024-01-04', revenue: 22000, orders: 22 },
        { period: '2024-01-05', revenue: 28000, orders: 28 },
        { period: '2024-01-06', revenue: 32000, orders: 32 }
      ];

      const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);
      const totalOrders = mockRevenueData.reduce((sum, item) => sum + item.orders, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const revenueAnalytics = {
        data: mockRevenueData,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: Math.round(averageOrderValue),
          period: timeRange
        }
      };

      res.success(revenueAnalytics, 'Revenue analytics retrieved successfully');

    } catch (error) {
      logger.error('Admin get revenue analytics error:', error);
      res.status(500).error(['Failed to retrieve revenue analytics'], 'Internal server error');
    }
  }
);

module.exports = router;
