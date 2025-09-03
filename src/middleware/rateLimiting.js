const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Default rate limiting configuration
const defaultConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: ['Too many requests from this IP, please try again later.'],
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded:', {
      ip: req.ip,
      url: req.url,
      userAgent: req.get('User-Agent'),
      userId: req.userId || 'anonymous'
    });
    
    res.status(429).error(
      ['Too many requests from this IP, please try again later.'],
      'Rate limit exceeded'
    );
  }
};

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    error: ['Too many authentication attempts, please try again later.'],
    message: 'Authentication rate limit exceeded'
  }
});

// Moderate rate limiting for API endpoints
const apiLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

// Lenient rate limiting for public content
const publicLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
});

// Strict rate limiting for search endpoints
const searchLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 searches per minute
  message: {
    success: false,
    error: ['Too many search requests, please try again later.'],
    message: 'Search rate limit exceeded'
  }
});

// Very strict rate limiting for password reset
const passwordResetLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    error: ['Too many password reset attempts, please try again later.'],
    message: 'Password reset rate limit exceeded'
  }
});

// Dynamic rate limiting based on user subscription
const createDynamicLimiter = (freeUserMax = 50, premiumUserMax = 200) => {
  return rateLimit({
    ...defaultConfig,
    max: (req) => {
      // Check if user is authenticated and has premium subscription
      if (req.user && req.user.subscription && req.user.subscription.plan === 'premium') {
        return premiumUserMax;
      }
      return freeUserMax;
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise use IP
      return req.userId || req.ip;
    }
  });
};

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  ...defaultConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    error: ['Too many upload attempts, please try again later.'],
    message: 'Upload rate limit exceeded'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  publicLimiter,
  searchLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createDynamicLimiter
};
