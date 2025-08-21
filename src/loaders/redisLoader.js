const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
async function redisLoader() {
  try {
    if (redisClient && isConnected) {
      logger.info('Redis already connected');
      return redisClient;
    }

    // Parse Redis URL
    const redisOptions = {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
    };

    // Create Redis client
    redisClient = new Redis(config.redisUrl, redisOptions);

    // Connect to Redis
    await redisClient.connect();
    isConnected = true;

    logger.info({ url: config.redisUrl.replace(/\/\/.*@/, '//***:***@') }, 'Redis connected successfully');

    // Handle connection events
    redisClient.on('error', (error) => {
      logger.error({ error: error.message }, 'Redis connection error');
      isConnected = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis connection ready');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        if (redisClient) {
          await redisClient.quit();
          logger.info('Redis connection closed through app termination');
        }
      } catch (error) {
        logger.error({ error: error.message }, 'Error closing Redis connection');
      }
    });

    return redisClient;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to connect to Redis');
    throw error;
  }
}

/**
 * Check Redis health
 */
async function checkRedisHealth() {
  try {
    if (!redisClient || !isConnected) {
      return { status: 'unhealthy', message: 'Not connected to Redis' };
    }

    // Ping Redis
    const pong = await redisClient.ping();
    
    if (pong === 'PONG') {
      return { 
        status: 'healthy', 
        message: 'Redis connection is healthy',
        ping: pong,
      };
    } else {
      return { 
        status: 'unhealthy', 
        message: `Unexpected ping response: ${pong}`,
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `Redis health check failed: ${error.message}`,
    };
  }
}

/**
 * Get Redis client instance
 */
function getRedisClient() {
  if (!redisClient || !isConnected) {
    throw new Error('Redis client not initialized or not connected');
  }
  return redisClient;
}

/**
 * Cache helper functions
 */
const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Cache get error');
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      const client = getRedisClient();
      await client.setex(key, ttlSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Cache set error');
      return false;
    }
  },

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Cache delete error');
      return false;
    }
  },

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      const client = getRedisClient();
      const exists = await client.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Cache exists error');
      return false;
    }
  },

  /**
   * Add to blacklist with TTL
   */
  async blacklist(key, ttlSeconds) {
    try {
      const client = getRedisClient();
      await client.setex(`blacklist:${key}`, ttlSeconds, '1');
      return true;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Blacklist error');
      return false;
    }
  },

  /**
   * Check if key is blacklisted
   */
  async isBlacklisted(key) {
    try {
      const client = getRedisClient();
      const exists = await client.exists(`blacklist:${key}`);
      return exists === 1;
    } catch (error) {
      logger.error({ error: error.message, key }, 'Blacklist check error');
      return false;
    }
  },
};

/**
 * Close Redis connection
 */
async function closeRedis() {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      redisClient = null;
      isConnected = false;
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error closing Redis connection');
    throw error;
  }
}

module.exports = {
  redisLoader,
  checkRedisHealth,
  getRedisClient,
  cache,
  closeRedis,
  get isConnected() {
    return isConnected;
  },
};
