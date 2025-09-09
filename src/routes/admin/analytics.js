const express = require('express');
const { query } = require('express-validator');
const { User, Content, Progress, Favorite } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Validation rules
const validateTimeRange = [
  query('timeRange').optional().isIn(['7d', '30d', '90d', '1y']),
  query('groupBy').optional().isIn(['day', 'week', 'month'])
];

// Helper function to get date range
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
};

// GET /admin/analytics/dashboard - Get dashboard overview stats
router.get('/dashboard',
  adminAuth,
  logAdminAction('GET_DASHBOARD_ANALYTICS'),
  async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // User metrics
      const totalUsers = await User.countDocuments();
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      const activeUsers = await User.countDocuments({
        lastLoginAt: { $gte: sevenDaysAgo }
      });

      // Content metrics
      const totalContent = await Content.countDocuments({ isActive: true });
      const totalPlays = await Progress.countDocuments();
      const totalCompletions = await Progress.countDocuments({ completed: true });
      const avgCompletionRate = totalPlays > 0 ? (totalCompletions / totalPlays * 100) : 0;

      // Revenue metrics (mock data for now - would integrate with payment system)
      const mockRevenue = {
        totalRevenue: 45600,
        monthlyRevenue: 12800,
        revenueGrowth: 23.5
      };

      // Subscription metrics
      const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
      const subscriptionRate = totalUsers > 0 ? (premiumUsers / totalUsers * 100) : 0;

      // Recent activity
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt')
        .lean();

      const popularContent = await Progress.aggregate([
        { $group: { _id: '$contentId', playCount: { $sum: 1 } } },
        { $sort: { playCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'contents',
            localField: '_id',
            foreignField: '_id',
            as: 'content'
          }
        },
        { $unwind: '$content' },
        {
          $project: {
            title: '$content.content.en.title',
            playCount: 1
          }
        }
      ]);

      const dashboardStats = {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          active: activeUsers,
          premium: premiumUsers,
          subscriptionRate: parseFloat(subscriptionRate.toFixed(1))
        },
        content: {
          total: totalContent,
          totalPlays,
          totalCompletions,
          avgCompletionRate: parseFloat(avgCompletionRate.toFixed(1))
        },
        revenue: mockRevenue,
        recentActivity: {
          recentUsers,
          popularContent
        }
      };

      res.success(dashboardStats, 'Dashboard analytics retrieved successfully');

    } catch (error) {
      logger.error('Admin get dashboard analytics error:', error);
      res.status(500).error(['Failed to retrieve dashboard analytics'], 'Internal server error');
    }
  }
);

// GET /admin/analytics/users - Get user analytics
router.get('/users',
  adminAuth,
  logAdminAction('GET_USER_ANALYTICS'),
  validateAdminRequest(validateTimeRange),
  async (req, res) => {
    try {
      const { timeRange = '30d', groupBy = 'day' } = req.query;
      const { startDate, endDate } = getDateRange(timeRange);

      // User growth over time
      const userGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: groupBy === 'day' ? '%Y-%m-%d' : 
                        groupBy === 'week' ? '%Y-%U' : '%Y-%m',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // User retention analysis
      const totalUsers = await User.countDocuments({
        createdAt: { $lte: endDate }
      });
      
      const activeUsers = await User.countDocuments({
        lastLoginAt: { $gte: startDate }
      });

      const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers * 100) : 0;

      // User distribution by provider
      const usersByProvider = await User.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ]);

      // User engagement metrics
      const avgSessionData = await Progress.aggregate([
        {
          $match: {
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$userId',
            sessionCount: { $sum: 1 },
            totalDuration: { $sum: '$total' }
          }
        },
        {
          $group: {
            _id: null,
            avgSessions: { $avg: '$sessionCount' },
            avgDuration: { $avg: '$totalDuration' }
          }
        }
      ]);

      const userAnalytics = {
        growth: userGrowth,
        retention: {
          rate: parseFloat(retentionRate.toFixed(1)),
          totalUsers,
          activeUsers
        },
        distribution: usersByProvider.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        engagement: {
          avgSessions: avgSessionData[0]?.avgSessions || 0,
          avgDuration: avgSessionData[0]?.avgDuration || 0
        }
      };

      res.success(userAnalytics, 'User analytics retrieved successfully');

    } catch (error) {
      logger.error('Admin get user analytics error:', error);
      res.status(500).error(['Failed to retrieve user analytics'], 'Internal server error');
    }
  }
);

// GET /admin/analytics/content - Get content analytics
router.get('/content',
  adminAuth,
  logAdminAction('GET_CONTENT_ANALYTICS'),
  validateAdminRequest(validateTimeRange),
  async (req, res) => {
    try {
      const { timeRange = '30d', contentId } = req.query;
      const { startDate, endDate } = getDateRange(timeRange);

      let matchFilter = {
        updatedAt: { $gte: startDate, $lte: endDate }
      };

      if (contentId) {
        matchFilter.contentId = contentId;
      }

      // Content engagement over time
      const engagementOverTime = await Progress.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$updatedAt'
              }
            },
            plays: { $sum: 1 },
            completions: {
              $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
            }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Top performing content
      const topContent = await Progress.aggregate([
        { $match: { updatedAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: '$contentId',
            playCount: { $sum: 1 },
            completionCount: {
              $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $multiply: [
                { $divide: ['$completionCount', '$playCount'] },
                100
              ]
            }
          }
        },
        { $sort: { playCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'contents',
            localField: '_id',
            foreignField: '_id',
            as: 'content'
          }
        },
        { $unwind: '$content' },
        {
          $project: {
            title: '$content.content.en.title',
            type: '$content.type',
            playCount: 1,
            completionCount: 1,
            completionRate: { $round: ['$completionRate', 1] }
          }
        }
      ]);

      // Content performance by category
      const performanceByType = await Progress.aggregate([
        { $match: { updatedAt: { $gte: startDate, $lte: endDate } } },
        {
          $lookup: {
            from: 'contents',
            localField: 'contentId',
            foreignField: '_id',
            as: 'content'
          }
        },
        { $unwind: '$content' },
        {
          $group: {
            _id: '$content.type',
            playCount: { $sum: 1 },
            completionCount: {
              $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
            }
          }
        },
        {
          $addFields: {
            completionRate: {
              $multiply: [
                { $divide: ['$completionCount', '$playCount'] },
                100
              ]
            }
          }
        }
      ]);

      const contentAnalytics = {
        engagementOverTime,
        topContent,
        performanceByType: performanceByType.map(item => ({
          ...item,
          completionRate: parseFloat(item.completionRate.toFixed(1))
        }))
      };

      res.success(contentAnalytics, 'Content analytics retrieved successfully');

    } catch (error) {
      logger.error('Admin get content analytics error:', error);
      res.status(500).error(['Failed to retrieve content analytics'], 'Internal server error');
    }
  }
);

// GET /admin/analytics/engagement - Get engagement metrics
router.get('/engagement',
  adminAuth,
  logAdminAction('GET_ENGAGEMENT_ANALYTICS'),
  validateAdminRequest(validateTimeRange),
  async (req, res) => {
    try {
      const { timeRange = '30d' } = req.query;
      const { startDate, endDate } = getDateRange(timeRange);

      // Daily active users
      const dailyActiveUsers = await Progress.aggregate([
        {
          $match: {
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$updatedAt'
                }
              },
              userId: '$userId'
            }
          }
        },
        {
          $group: {
            _id: '$_id.date',
            activeUsers: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Session duration analysis
      const sessionAnalysis = await Progress.aggregate([
        {
          $match: {
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            avgProgress: { $avg: '$progress' },
            avgTotal: { $avg: '$total' },
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$completed', true] }, 1, 0] }
            }
          }
        }
      ]);

      // User engagement by time of day
      const engagementByHour = await Progress.aggregate([
        {
          $match: {
            updatedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $hour: '$updatedAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      const engagementMetrics = {
        dailyActiveUsers,
        sessionAnalysis: sessionAnalysis[0] || {
          avgProgress: 0,
          avgTotal: 0,
          totalSessions: 0,
          completedSessions: 0
        },
        engagementByHour
      };

      res.success(engagementMetrics, 'Engagement analytics retrieved successfully');

    } catch (error) {
      logger.error('Admin get engagement analytics error:', error);
      res.status(500).error(['Failed to retrieve engagement analytics'], 'Internal server error');
    }
  }
);

module.exports = router;
