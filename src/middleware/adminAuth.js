const { authenticate, authorize } = require('./auth');
const { validationResult } = require('express-validator');
const logger = require('../config/logger');

// Admin authentication middleware - combines authentication and admin role check
const adminAuth = [
  authenticate, // First authenticate the user
  authorize('admin') // Then check for admin role
];

// Admin action logger middleware - logs all admin actions for audit trail
const logAdminAction = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the admin action
      logger.info('Admin Action', {
        action,
        adminId: req.userId,
        adminEmail: req.user?.email,
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        timestamp: new Date().toISOString(),
        success: res.statusCode < 400
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

// Validation helper for admin endpoints
const validateAdminRequest = (validationRules) => {
  return [
    ...validationRules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errorMessages
        });
      }
      next();
    }
  ];
};

module.exports = {
  adminAuth,
  logAdminAction,
  validateAdminRequest
};
