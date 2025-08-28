const { error } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  GoogleAuthError
} = require('../../../utils/errors');

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error with request context
  const logContext = {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    userId: req.userId,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  };

  // Determine log level based on error type
  if (err.status >= 400 && err.status < 500) {
    logger.warn(logContext, 'Client error');
  } else {
    logger.error(logContext, 'Server error');
  }

  // Handle different error types
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An internal error occurred';

  // Custom application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }

  // Validation errors (Zod, Mongoose, etc.)
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    
    // Extract validation details for Mongoose errors
    if (err.errors) {
      const validationErrors = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value,
      }));
      return res.status(statusCode).json(error(validationErrors, message));
    }
  }
  
  // MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Resource already exists';
    
    // Extract field name from duplicate key error
    const field = Object.keys(err.keyPattern || {})[0] || 'unknown';
    return res.status(statusCode).json(error([{ field, code: 'DUPLICATE' }], message));
  }
  
  // MongoDB cast error (invalid ObjectId, etc.)
  else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_FORMAT';
    message = `Invalid ${err.path}: ${err.value}`;
  }
  
  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid token';
  }
  
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token expired';
  }
  
  // HTTP errors with status
  else if (err.status || err.statusCode) {
    statusCode = err.status || err.statusCode;
    
    if (statusCode === 404) {
      errorCode = 'NOT_FOUND';
      message = 'Resource not found';
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN';
      message = 'Access denied';
    } else if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED';
      message = 'Authentication required';
    } else if (statusCode >= 400 && statusCode < 500) {
      errorCode = 'CLIENT_ERROR';
      message = err.message || 'Client error';
    }
  }
  
  // Rate limiting errors
  else if (err.type === 'entity.too.large') {
    statusCode = 413;
    errorCode = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload too large';
  }
  
  // Syntax errors (malformed JSON, etc.)
  else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    message = 'An internal error occurred';
    errorCode = 'INTERNAL_ERROR';
  } else if (err.message && statusCode < 500) {
    message = err.message;
  }

  // Send error response
  res.status(statusCode).json(error([errorCode], message));
}

/**
 * 404 handler for unmatched routes
 */
function notFoundHandler(req, res) {
  logger.warn({
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, 'Route not found');
  
  res.status(404).json(error(['NOT_FOUND'], `Route ${req.method} ${req.path} not found`));
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
