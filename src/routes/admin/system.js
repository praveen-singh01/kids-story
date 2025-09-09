const express = require('express');
const { query, body } = require('express-validator');
const os = require('os');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const { User, Content, Progress, Favorite } = require('../../models');
const logger = require('../../config/logger');

const router = express.Router();

// GET /admin/system/stats - Get system statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_SYSTEM_STATS'),
  async (req, res) => {
    try {
      // System information
      const systemInfo = {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        uptime: process.uptime(),
        hostname: os.hostname()
      };

      // Memory usage
      const memoryUsage = process.memoryUsage();
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const memoryStats = {
        total: Math.round(totalMemory / 1024 / 1024), // MB
        used: Math.round(usedMemory / 1024 / 1024), // MB
        free: Math.round(freeMemory / 1024 / 1024), // MB
        usagePercentage: Math.round((usedMemory / totalMemory) * 100),
        process: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        }
      };

      // CPU information
      const cpus = os.cpus();
      const cpuStats = {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        speed: cpus[0]?.speed || 0,
        loadAverage: os.loadavg()
      };

      // Database statistics
      const dbStats = {
        totalUsers: await User.countDocuments(),
        totalContent: await Content.countDocuments(),
        totalProgress: await Progress.countDocuments(),
        totalFavorites: await Favorite.countDocuments()
      };

      // Application health
      const healthStatus = {
        status: 'healthy',
        database: 'connected',
        memory: memoryStats.usagePercentage < 80 ? 'good' : 'warning',
        uptime: formatUptime(process.uptime())
      };

      const systemStats = {
        system: systemInfo,
        memory: memoryStats,
        cpu: cpuStats,
        database: dbStats,
        health: healthStatus,
        timestamp: new Date().toISOString()
      };

      res.success(systemStats, 'System statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get system stats error:', error);
      res.status(500).error(['Failed to retrieve system statistics'], 'Internal server error');
    }
  }
);

// GET /admin/system/logs - Get system logs
router.get('/logs',
  adminAuth,
  logAdminAction('GET_SYSTEM_LOGS'),
  validateAdminRequest([
    query('level').optional().isIn(['error', 'warn', 'info', 'debug']),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
    query('dateFrom').optional().isISO8601(),
    query('dateTo').optional().isISO8601()
  ]),
  async (req, res) => {
    try {
      const {
        level = 'info',
        limit = 100,
        dateFrom,
        dateTo
      } = req.query;

      // Mock log data since we don't have a centralized logging system
      // In a real implementation, this would query your logging system (Winston, ELK, etc.)
      const mockLogs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'User authentication successful',
          meta: { userId: '507f1f77bcf86cd799439011', ip: '192.168.1.1' }
        },
        {
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warn',
          message: 'High memory usage detected',
          meta: { memoryUsage: '85%' }
        },
        {
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'error',
          message: 'Database connection timeout',
          meta: { error: 'Connection timeout after 30s' }
        },
        {
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'info',
          message: 'Content uploaded successfully',
          meta: { contentId: '507f1f77bcf86cd799439012', adminId: req.userId }
        }
      ];

      // Filter logs based on parameters
      let filteredLogs = mockLogs;
      
      if (level !== 'debug') {
        const levelPriority = { error: 0, warn: 1, info: 2, debug: 3 };
        const targetPriority = levelPriority[level];
        filteredLogs = filteredLogs.filter(log => levelPriority[log.level] <= targetPriority);
      }

      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate);
      }

      if (dateTo) {
        const toDate = new Date(dateTo);
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate);
      }

      // Apply limit
      filteredLogs = filteredLogs.slice(0, limit);

      const logResponse = {
        logs: filteredLogs,
        total: filteredLogs.length,
        filters: {
          level,
          limit,
          dateFrom,
          dateTo
        }
      };

      res.success(logResponse, 'System logs retrieved successfully');

    } catch (error) {
      logger.error('Admin get system logs error:', error);
      res.status(500).error(['Failed to retrieve system logs'], 'Internal server error');
    }
  }
);

// GET /admin/system/settings - Get system settings
router.get('/settings',
  adminAuth,
  logAdminAction('GET_SYSTEM_SETTINGS'),
  async (req, res) => {
    try {
      // Mock system settings
      // In a real implementation, these would be stored in database or config files
      const systemSettings = {
        app: {
          name: 'Kids Story App',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: false,
          registrationEnabled: true,
          maxFileUploadSize: 50 // MB
        },
        security: {
          jwtExpiresIn: '24h',
          passwordMinLength: 6,
          maxLoginAttempts: 5,
          sessionTimeout: 24 // hours
        },
        notifications: {
          emailEnabled: true,
          pushEnabled: true,
          smsEnabled: false
        },
        api: {
          rateLimitEnabled: true,
          maxRequestsPerMinute: 100,
          corsEnabled: true
        },
        storage: {
          provider: 'local',
          maxFileSize: 50 * 1024 * 1024, // 50MB in bytes
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'mp3', 'wav']
        }
      };

      res.success(systemSettings, 'System settings retrieved successfully');

    } catch (error) {
      logger.error('Admin get system settings error:', error);
      res.status(500).error(['Failed to retrieve system settings'], 'Internal server error');
    }
  }
);

// PATCH /admin/system/settings - Update system settings
router.patch('/settings',
  adminAuth,
  logAdminAction('UPDATE_SYSTEM_SETTINGS'),
  validateAdminRequest([
    body('app.name').optional().trim().isLength({ min: 1, max: 100 }),
    body('app.maintenanceMode').optional().isBoolean(),
    body('app.registrationEnabled').optional().isBoolean(),
    body('app.maxFileUploadSize').optional().isInt({ min: 1, max: 1000 }),
    body('security.passwordMinLength').optional().isInt({ min: 4, max: 20 }),
    body('security.maxLoginAttempts').optional().isInt({ min: 1, max: 10 }),
    body('security.sessionTimeout').optional().isInt({ min: 1, max: 168 }),
    body('notifications.emailEnabled').optional().isBoolean(),
    body('notifications.pushEnabled').optional().isBoolean(),
    body('notifications.smsEnabled').optional().isBoolean(),
    body('api.rateLimitEnabled').optional().isBoolean(),
    body('api.maxRequestsPerMinute').optional().isInt({ min: 10, max: 1000 })
  ]),
  async (req, res) => {
    try {
      const updateData = req.body;

      // In a real implementation, you would:
      // 1. Validate the settings
      // 2. Update the configuration in database/config files
      // 3. Apply the changes to the running application
      // 4. Restart services if necessary

      logger.info(`System settings updated by admin ${req.userId}`, updateData);

      // Mock response - return the updated settings
      const updatedSettings = {
        app: {
          name: updateData.app?.name || 'Kids Story App',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          maintenanceMode: updateData.app?.maintenanceMode ?? false,
          registrationEnabled: updateData.app?.registrationEnabled ?? true,
          maxFileUploadSize: updateData.app?.maxFileUploadSize || 50
        },
        security: {
          jwtExpiresIn: '24h',
          passwordMinLength: updateData.security?.passwordMinLength || 6,
          maxLoginAttempts: updateData.security?.maxLoginAttempts || 5,
          sessionTimeout: updateData.security?.sessionTimeout || 24
        },
        notifications: {
          emailEnabled: updateData.notifications?.emailEnabled ?? true,
          pushEnabled: updateData.notifications?.pushEnabled ?? true,
          smsEnabled: updateData.notifications?.smsEnabled ?? false
        },
        api: {
          rateLimitEnabled: updateData.api?.rateLimitEnabled ?? true,
          maxRequestsPerMinute: updateData.api?.maxRequestsPerMinute || 100,
          corsEnabled: true
        },
        updatedAt: new Date().toISOString(),
        updatedBy: req.userId
      };

      res.success(updatedSettings, 'System settings updated successfully');

    } catch (error) {
      logger.error('Admin update system settings error:', error);
      res.status(500).error(['Failed to update system settings'], 'Internal server error');
    }
  }
);

// Helper function to format uptime
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

module.exports = router;
