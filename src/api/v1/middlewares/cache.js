const { cache } = require('../../../loaders/redisLoader');
const { success } = require('../../../utils/envelope');
const logger = require('../../../utils/logger');

/**
 * Cache middleware for GET requests
 * @param {number} ttlSeconds - Cache TTL in seconds
 * @param {function} keyGenerator - Function to generate cache key from request
 */
function cacheMiddleware(ttlSeconds = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        // Default key generation
        const userId = req.userId || 'anonymous';
        const kidId = req.query.kidId || '';
        const queryString = new URLSearchParams(req.query).toString();
        cacheKey = `cache:${req.route?.path || req.path}:${userId}:${kidId}:${queryString}`;
      }

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        logger.debug({ cacheKey }, 'Cache hit');
        return res.json(success(cachedData, 'Data retrieved from cache'));
      }

      logger.debug({ cacheKey }, 'Cache miss');

      // Store original res.json to intercept response
      const originalJson = res.json;
      
      res.json = function(data) {
        // Only cache successful responses
        if (data && data.success && data.data) {
          cache.set(cacheKey, data.data, ttlSeconds)
            .then(() => {
              logger.debug({ cacheKey, ttl: ttlSeconds }, 'Data cached');
            })
            .catch(error => {
              logger.warn({ error: error.message, cacheKey }, 'Failed to cache data');
            });
        }
        
        // Call original res.json
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.warn({ error: error.message }, 'Cache middleware error');
      // Continue without caching on error
      next();
    }
  };
}

/**
 * Cache key generators for common patterns
 */
const cacheKeys = {
  home: (req) => {
    const userId = req.userId || 'anonymous';
    const kidId = req.query.kidId || '';
    return `cache:home:${userId}:${kidId}`;
  },
  
  explore: (req) => {
    const { type, sort, limit, offset } = req.query;
    return `cache:explore:${type || 'all'}:${sort || 'popular'}:${limit || 10}:${offset || 0}`;
  },
  
  content: (req) => {
    const slug = req.params.slug;
    return `cache:content:${slug}`;
  },
  
  favorites: (req) => {
    const userId = req.userId;
    const kidId = req.query.kidId || '';
    return `cache:favorites:${userId}:${kidId}`;
  },
};

/**
 * Predefined cache middlewares
 */
const homeCache = cacheMiddleware(300, cacheKeys.home); // 5 minutes
const exploreCache = cacheMiddleware(600, cacheKeys.explore); // 10 minutes
const contentCache = cacheMiddleware(3600, cacheKeys.content); // 1 hour
const favoritesCache = cacheMiddleware(300, cacheKeys.favorites); // 5 minutes

/**
 * Cache invalidation helpers
 */
const invalidateCache = {
  async user(userId) {
    const patterns = [
      `cache:home:${userId}:*`,
      `cache:favorites:${userId}:*`,
    ];
    
    for (const pattern of patterns) {
      try {
        await cache.del(pattern);
      } catch (error) {
        logger.warn({ error: error.message, pattern }, 'Failed to invalidate cache pattern');
      }
    }
  },
  
  async content(slug) {
    await cache.del(`cache:content:${slug}`);
    // Also invalidate explore cache as it might contain this content
    await cache.del('cache:explore:*');
  },
  
  async explore() {
    await cache.del('cache:explore:*');
  },
  
  async home() {
    await cache.del('cache:home:*');
  },
};

module.exports = {
  cacheMiddleware,
  cacheKeys,
  homeCache,
  exploreCache,
  contentCache,
  favoritesCache,
  invalidateCache,
};
