const { mongoLoader } = require('./mongoLoader');
const { redisLoader } = require('./redisLoader');
const { expressLoader, loadErrorHandling } = require('./expressLoader');
const routesLoader = require('./routesLoader');
const swaggerLoader = require('./swaggerLoader');
const logger = require('../utils/logger');

/**
 * Initialize all loaders in the correct order
 */
async function initLoaders(app) {
  try {
    logger.info('Starting application loaders...');
    
    // 1. Initialize databases first
    logger.info('Initializing databases...');
    await mongoLoader();
    await redisLoader();
    
    // 2. Initialize Express middleware
    logger.info('Initializing Express middleware...');
    expressLoader(app);
    
    // 3. Load API routes
    logger.info('Loading API routes...');
    routesLoader(app);
    
    // 4. Load Swagger documentation
    logger.info('Loading Swagger documentation...');
    swaggerLoader(app);
    
    // 5. Load error handling (must be last)
    logger.info('Loading error handling...');
    loadErrorHandling(app);
    
    logger.info('All loaders initialized successfully');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to initialize loaders');
    throw error;
  }
}

module.exports = {
  initLoaders,
  mongoLoader,
  redisLoader,
  expressLoader,
  routesLoader,
  swaggerLoader,
  loadErrorHandling,
};
