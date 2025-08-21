const { verifyAccessToken } = require('../../../utils/jwt');
const { cache } = require('../../../loaders/redisLoader');
const { User } = require('../../../models');
const { error } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');

/**
 * Middleware to verify JWT access token and attach user to request
 */
async function authGuard(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error(['MISSING_TOKEN'], 'Authorization token required'));
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json(error(['MISSING_TOKEN'], 'Authorization token required'));
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtError) {
      logger.warn({ error: jwtError.message, token: token.substring(0, 20) + '...' }, 'Invalid JWT token');
      return res.status(401).json(error(['INVALID_TOKEN'], 'Invalid or expired token'));
    }

    if (decoded.type !== 'access') {
      return res.status(401).json(error(['INVALID_TOKEN_TYPE'], 'Invalid token type'));
    }

    const userId = decoded.sub;
    
    // Try to get user from cache first
    let user = await cache.get(`user:${userId}`);
    
    if (!user) {
      // Fetch user from database
      user = await User.findById(userId).lean();
      
      if (!user) {
        return res.status(401).json(error(['USER_NOT_FOUND'], 'User not found'));
      }
      
      // Cache user for 5 minutes
      await cache.set(`user:${userId}`, user, 300);
    }

    // Attach user and token info to request
    req.user = user;
    req.userId = userId;
    req.token = decoded;
    
    // Add user info to logger context
    req.log = logger.child({ userId });
    
    next();
  } catch (err) {
    logger.error({ error: err.message }, 'Auth guard error');
    return res.status(500).json(error(['AUTH_ERROR'], 'Authentication error'));
  }
}

/**
 * Optional auth guard - doesn't fail if no token provided
 */
async function optionalAuthGuard(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No token provided, continue without user
    req.user = null;
    req.userId = null;
    req.token = null;
    req.log = logger;
    return next();
  }

  // Token provided, use regular auth guard
  return authGuard(req, res, next);
}

module.exports = {
  authGuard,
  optionalAuthGuard,
};
