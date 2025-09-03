const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Invalid resource ID';
    return res.status(400).error([message], 'Bad Request');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    return res.status(409).error([message], 'Duplicate Resource');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).error(messages, 'Validation Error');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).error(['Invalid token'], 'Authentication Error');
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).error(['Token expired'], 'Authentication Error');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).error(['File too large'], 'Upload Error');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).error(['Unexpected file field'], 'Upload Error');
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;
  const errors = statusCode === 500 ? ['Something went wrong'] : [message];

  res.status(statusCode).error(errors, message);
};

module.exports = errorHandler;
