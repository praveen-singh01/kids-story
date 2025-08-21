const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const config = require('../../../config');
const { error } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');

/**
 * Custom rate limit handler that returns envelope format
 */
function rateLimitHandler(req, res) {
  const retryAfter = Math.round(req.rateLimit.resetTime / 1000);
  
  res.set('Retry-After', retryAfter);
  
  logger.warn({
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    limit: req.rateLimit.limit,
    remaining: req.rateLimit.remaining,
    resetTime: req.rateLimit.resetTime,
  }, 'Rate limit exceeded');
  
  return res.status(429).json(error(
    ['RATE_LIMIT_EXCEEDED'], 
    `Too many requests. Try again in ${retryAfter} seconds.`
  ));
}

/**
 * Custom slow down delay handler
 */
function slowDownDelayHandler(req, res, next, delay) {
  logger.info({
    ip: req.ip,
    path: req.path,
    delay,
  }, 'Request slowed down due to rate limiting');

  setTimeout(next, delay);
}

/**
 * Public rate limiter for general API endpoints
 */
const publicRateLimit = rateLimit({
  windowMs: config.rateLimit.public.windowMs,
  max: config.rateLimit.public.max,
  message: error(['RATE_LIMIT_EXCEEDED'], 'Too many requests from this IP'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/healthz' || req.path === '/readyz';
  },
});

/**
 * Auth endpoints rate limiter (stricter)
 */
const authRateLimit = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: error(['AUTH_RATE_LIMIT_EXCEEDED'], 'Too many authentication attempts'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use IP + User-Agent for auth endpoints to prevent abuse
    return `${req.ip}:${req.get('User-Agent') || 'unknown'}`;
  },
});

/**
 * Per-user rate limiter for authenticated endpoints
 */
const userRateLimit = rateLimit({
  windowMs: config.rateLimit.perUser.windowMs,
  max: config.rateLimit.perUser.max,
  message: error(['USER_RATE_LIMIT_EXCEEDED'], 'Too many requests from this user'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use userId if authenticated, otherwise fall back to IP
    return req.userId || req.ip;
  },
  skip: (req) => {
    // Skip for non-authenticated requests (they use public rate limit)
    return !req.userId;
  },
});

/**
 * Slow down middleware for write operations
 */
const writeSlowDown = slowDown({
  windowMs: 60 * 1000, // 1 minute
  delayAfter: 5, // Allow 5 requests per minute at full speed
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 5000, // Maximum delay of 5 seconds
  keyGenerator: (req) => {
    return req.userId || req.ip;
  },
  skip: (req) => {
    // Only apply to write operations
    return req.method === 'GET' || req.method === 'HEAD';
  },
});

/**
 * Admin rate limiter (more lenient)
 */
const adminRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 requests per minute for admins
  message: error(['ADMIN_RATE_LIMIT_EXCEEDED'], 'Too many admin requests'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return `admin:${req.userId || req.ip}`;
  },
  skip: (req) => {
    // Only apply to admin users
    return !req.user || !req.user.roles.includes('admin');
  },
});

module.exports = {
  publicRateLimit,
  authRateLimit,
  userRateLimit,
  writeSlowDown,
  adminRateLimit,
};
