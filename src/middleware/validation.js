const { validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Generic validation middleware that can be used with express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => {
      // Log validation errors for monitoring
      logger.warn('Validation error:', {
        field: error.param,
        value: error.value,
        message: error.msg,
        location: error.location,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        url: req.url
      });
      
      return error.msg;
    });
    
    return res.status(400).error(errorMessages, 'Validation failed');
  }
  
  next();
};

/**
 * Sanitize request data to prevent XSS and other attacks
 */
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize strings in request body
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      // Basic XSS prevention - remove script tags and javascript: protocols
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

/**
 * Request size limiter middleware
 */
const limitRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).error(
          ['Request entity too large'],
          'Payload too large'
        );
      }
    }
    
    next();
  };
};

/**
 * Helper function to parse size strings like '10mb', '1gb', etc.
 */
const parseSize = (size) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };
  
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  
  if (!match) {
    return 0;
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * (units[unit] || 1));
};

/**
 * Security headers middleware (additional to helmet)
 */
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-API-Version', process.env.API_VERSION || 'v1');
  res.setHeader('X-Request-ID', req.id || 'unknown');
  
  // Prevent information disclosure
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request logging middleware for debugging
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('Incoming request:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    userId: req.userId || 'anonymous'
  });
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed:', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.userId || 'anonymous'
    });
  });
  
  next();
};

module.exports = {
  validateRequest,
  sanitizeInput,
  limitRequestSize,
  securityHeaders,
  requestLogger
};
