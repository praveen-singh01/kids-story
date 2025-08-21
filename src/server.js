const express = require('express');
const config = require('./config');
const logger = require('./utils/logger');
const { initLoaders } = require('./loaders');

/**
 * Start the server
 */
async function startServer() {
  try {
    // Create Express app
    const app = express();
    
    // Initialize all loaders
    await initLoaders(app);
    
    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info({
        port: config.port,
        nodeEnv: config.nodeEnv,
        mongoUri: config.mongoUri.replace(/\/\/.*@/, '//***:***@'),
        redisUrl: config.redisUrl.replace(/\/\/.*@/, '//***:***@'),
      }, `🚀 Bedtime Stories API server started on port ${config.port}`);
      
      logger.info(`📚 API Documentation: http://localhost:${config.port}/docs`);
      logger.info(`❤️  Health Check: http://localhost:${config.port}/healthz`);
    });
    
    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error({ error: err.message }, 'Error during server shutdown');
          process.exit(1);
        }
        
        logger.info('HTTP server closed');
        
        try {
          // Close database connections
          const { closeMongo } = require('./loaders/mongoLoader');
          const { closeRedis } = require('./loaders/redisLoader');
          
          await closeMongo();
          await closeRedis();
          
          logger.info('Database connections closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error({ error: error.message }, 'Error during graceful shutdown');
          process.exit(1);
        }
      });
      
      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal({ error: error.message, stack: error.stack }, 'Uncaught exception');
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled promise rejection');
      process.exit(1);
    });
    
    return server;
  } catch (error) {
    logger.fatal({ error: error.message }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = startServer;
