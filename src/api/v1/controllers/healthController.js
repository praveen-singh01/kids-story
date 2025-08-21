const { checkMongoHealth } = require('../../../loaders/mongoLoader');
const { checkRedisHealth } = require('../../../loaders/redisLoader');
const { success, error } = require('../../../utils/envelope');
const config = require('../../../config');

class HealthController {
  /**
   * Health check endpoint
   */
  async healthCheck(req, res, next) {
    try {
      const mongoHealth = await checkMongoHealth();
      const redisHealth = await checkRedisHealth();
      
      const isHealthy = mongoHealth.status === 'healthy' && redisHealth.status === 'healthy';
      
      const healthData = {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.nodeEnv,
        components: {
          mongodb: mongoHealth,
          redis: redisHealth,
        },
      };
      
      const statusCode = isHealthy ? 200 : 503;
      res.status(statusCode).json(success(healthData, isHealthy ? 'Service is healthy' : 'Service is unhealthy'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Readiness check endpoint
   */
  async readinessCheck(req, res, next) {
    try {
      const mongoHealth = await checkMongoHealth();
      const redisHealth = await checkRedisHealth();
      
      const isReady = mongoHealth.status === 'healthy' && redisHealth.status === 'healthy';
      
      const readinessData = {
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        components: {
          mongodb: mongoHealth,
          redis: redisHealth,
        },
      };
      
      const statusCode = isReady ? 200 : 503;
      res.status(statusCode).json(success(readinessData, isReady ? 'Service is ready' : 'Service is not ready'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Metrics endpoint (basic)
   */
  async getMetrics(req, res, next) {
    try {
      const metrics = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };
      
      res.json(success(metrics, 'Metrics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HealthController();
