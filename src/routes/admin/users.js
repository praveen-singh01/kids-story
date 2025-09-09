const express = require('express');
const { body, query, param } = require('express-validator');
const { User, Kid, Progress, Favorite } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Validation rules
const validateUserCreation = [
  body('name').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6, max: 100 }),
  body('provider').optional().isIn(['email', 'google']),
  body('roles').optional().isArray(),
  body('roles.*').optional().isIn(['user', 'admin']),
  body('subscription.plan').optional().isIn(['free', 'premium']),
  body('isActive').optional().isBoolean()
];

const validateUserUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('roles').optional().isArray(),
  body('roles.*').optional().isIn(['user', 'admin']),
  body('isActive').optional().isBoolean(),
  body('subscription.plan').optional().isIn(['free', 'premium']),
  body('subscription.status').optional().isIn(['active', 'inactive', 'cancelled'])
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('status').optional().isIn(['active', 'inactive']),
  query('provider').optional().isIn(['email', 'google']),
  query('subscription').optional().isIn(['free', 'premium'])
];

// POST /admin/users - Create a new user
router.post('/',
  adminAuth,
  logAdminAction('CREATE_USER'),
  validateAdminRequest(validateUserCreation),
  async (req, res) => {
    try {
      const { name, email, password, provider = 'email', roles = ['user'], subscription, isActive = true } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).error(['User already exists with this email'], 'User creation failed');
      }

      // Create new user
      const userData = {
        name,
        email,
        provider,
        roles,
        isActive,
        subscription: {
          plan: subscription?.plan || 'free',
          status: subscription?.status || 'active',
          startDate: new Date(),
          ...(subscription?.plan === 'premium' && {
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
          })
        }
      };

      // Only set password for email provider
      if (provider === 'email') {
        userData.password = password;
      }

      const user = new User(userData);
      await user.save();

      // Remove password from response
      const userResponse = user.toObject();
      delete userResponse.password;

      logger.info(`New user created by admin: ${email}`);

      res.status(201).success(userResponse, 'User created successfully');

    } catch (error) {
      logger.error('Admin create user error:', error);
      res.status(500).error(['Failed to create user'], 'Internal server error');
    }
  }
);

// GET /admin/users - List all users with pagination and filtering
router.get('/', 
  adminAuth, 
  logAdminAction('LIST_USERS'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        provider,
        subscription
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (status) {
        filter.isActive = status === 'active';
      }
      
      if (provider) {
        filter.provider = provider;
      }
      
      if (subscription) {
        filter['subscription.plan'] = subscription;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users with pagination
      const users = await User.find(filter)
        .select('-password -emailVerificationToken -passwordResetToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalUsers = await User.countDocuments(filter);
      const totalPages = Math.ceil(totalUsers / limit);

      // Add additional user data
      const enrichedUsers = await Promise.all(users.map(async (user) => {
        const kidCount = await Kid.countDocuments({ userId: user._id, isActive: true });
        const favoriteCount = await Favorite.countDocuments({ userId: user._id });
        const progressCount = await Progress.countDocuments({ userId: user._id });

        return {
          ...user,
          kidCount,
          favoriteCount,
          progressCount,
          lastLoginAt: user.lastLoginAt || null
        };
      }));

      const response = {
        users: enrichedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      res.success(response, 'Users retrieved successfully');

    } catch (error) {
      logger.error('Admin get users error:', error);
      res.status(500).error(['Failed to retrieve users'], 'Internal server error');
    }
  }
);

// GET /admin/users/stats - Get user statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_USER_STATS'),
  async (req, res) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get basic counts
      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const premiumUsers = await User.countDocuments({ 'subscription.plan': 'premium' });
      
      // Get new users in different time periods
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: thirtyDaysAgo }
      });
      
      const newUsersThisWeek = await User.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Get users by provider
      const usersByProvider = await User.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ]);

      // Get subscription distribution
      const subscriptionStats = await User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
      ]);

      // Calculate growth rate (comparing last 30 days to previous 30 days)
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousMonthUsers = await User.countDocuments({
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
      });
      
      const growthRate = previousMonthUsers > 0 
        ? ((newUsersThisMonth - previousMonthUsers) / previousMonthUsers * 100).toFixed(1)
        : 0;

      const stats = {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        newUsersThisMonth,
        newUsersThisWeek,
        growthRate: parseFloat(growthRate),
        usersByProvider: usersByProvider.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        subscriptionDistribution: subscriptionStats.reduce((acc, item) => {
          acc[item._id || 'free'] = item.count;
          return acc;
        }, {})
      };

      res.success(stats, 'User statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get user stats error:', error);
      res.status(500).error(['Failed to retrieve user statistics'], 'Internal server error');
    }
  }
);

// GET /admin/users/:id - Get specific user details
router.get('/:id',
  adminAuth,
  logAdminAction('GET_USER_DETAILS'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findById(id)
        .select('-password -emailVerificationToken -passwordResetToken')
        .lean();

      if (!user) {
        return res.status(404).error(['User not found'], 'User not found');
      }

      // Get related data
      const kids = await Kid.find({ userId: id, isActive: true }).lean();
      const favorites = await Favorite.find({ userId: id }).populate('contentId').lean();
      const progress = await Progress.find({ userId: id }).populate('contentId').lean();

      const userDetails = {
        ...user,
        kids,
        favorites,
        progress,
        stats: {
          kidCount: kids.length,
          favoriteCount: favorites.length,
          progressCount: progress.length
        }
      };

      res.success(userDetails, 'User details retrieved successfully');

    } catch (error) {
      logger.error('Admin get user details error:', error);
      res.status(500).error(['Failed to retrieve user details'], 'Internal server error');
    }
  }
);

// PATCH /admin/users/:id - Update user profile
router.patch('/:id',
  adminAuth,
  logAdminAction('UPDATE_USER'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  validateAdminRequest(validateUserUpdate),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password -emailVerificationToken -passwordResetToken');

      if (!user) {
        return res.status(404).error(['User not found'], 'User not found');
      }

      res.success(user, 'User updated successfully');

    } catch (error) {
      logger.error('Admin update user error:', error);
      res.status(500).error(['Failed to update user'], 'Internal server error');
    }
  }
);

// DELETE /admin/users/:id - Deactivate user (soft delete)
router.delete('/:id',
  adminAuth,
  logAdminAction('DEACTIVATE_USER'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).error(['User not found'], 'User not found');
      }

      res.success({ deactivated: true, user }, 'User deactivated successfully');

    } catch (error) {
      logger.error('Admin deactivate user error:', error);
      res.status(500).error(['Failed to deactivate user'], 'Internal server error');
    }
  }
);

// GET /admin/users/:id/activity - Get user activity log
router.get('/:id/activity',
  adminAuth,
  logAdminAction('GET_USER_ACTIVITY'),
  [param('id').isMongoId().withMessage('Invalid user ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).error(['User not found'], 'User not found');
      }

      // Get recent progress updates (as activity indicators)
      const recentProgress = await Progress.find({ userId: id })
        .populate('contentId', 'title')
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();

      // Get recent favorites
      const recentFavorites = await Favorite.find({ userId: id })
        .populate('contentId', 'title')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const activity = {
        lastLogin: user.lastLoginAt,
        recentProgress: recentProgress.map(p => ({
          type: 'progress',
          contentTitle: p.contentId?.title || 'Unknown Content',
          progress: p.progress,
          total: p.total,
          completed: p.completed,
          timestamp: p.updatedAt
        })),
        recentFavorites: recentFavorites.map(f => ({
          type: 'favorite',
          contentTitle: f.contentId?.title || 'Unknown Content',
          timestamp: f.createdAt
        }))
      };

      res.success(activity, 'User activity retrieved successfully');

    } catch (error) {
      logger.error('Admin get user activity error:', error);
      res.status(500).error(['Failed to retrieve user activity'], 'Internal server error');
    }
  }
);

module.exports = router;
