const v1Routes = require('../api/v1/routes');
const { publicRateLimit } = require('../api/v1/middlewares');
const logger = require('../utils/logger');

/**
 * Load API routes
 */
function routesLoader(app) {
  // Apply global rate limiting to all API routes
  app.use('/api', publicRateLimit);
  
  // Mount v1 API routes
  app.use('/api/v1', v1Routes);
  
  // Root redirect to API docs
  app.get('/', (req, res) => {
    res.redirect('/docs');
  });
  
  logger.info('API routes loaded successfully');
}

module.exports = routesLoader;
