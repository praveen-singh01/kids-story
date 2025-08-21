// Export all middlewares for easy importing
const { authGuard, optionalAuthGuard } = require('./authGuard');
const { roleGuard, adminGuard, anyRoleGuard } = require('./roleGuard');
const { m2mGuard, paymentsM2MGuard } = require('./m2mGuard');
const { 
  cacheMiddleware, 
  homeCache, 
  exploreCache, 
  contentCache, 
  favoritesCache,
  invalidateCache 
} = require('./cache');
const { 
  publicRateLimit, 
  authRateLimit, 
  userRateLimit, 
  writeSlowDown, 
  adminRateLimit 
} = require('./rateLimiter');
const requestIdMiddleware = require('./requestId');
const { errorHandler, notFoundHandler } = require('./errorHandler');

module.exports = {
  // Auth middlewares
  authGuard,
  optionalAuthGuard,
  roleGuard,
  adminGuard,
  anyRoleGuard,
  m2mGuard,
  paymentsM2MGuard,
  
  // Cache middlewares
  cacheMiddleware,
  homeCache,
  exploreCache,
  contentCache,
  favoritesCache,
  invalidateCache,
  
  // Rate limiting
  publicRateLimit,
  authRateLimit,
  userRateLimit,
  writeSlowDown,
  adminRateLimit,
  
  // Utility middlewares
  requestIdMiddleware,
  errorHandler,
  notFoundHandler,
};
