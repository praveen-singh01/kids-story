const mongoose = require('mongoose');
const config = require('../config');
const logger = require('../utils/logger');

let isConnected = false;

/**
 * Initialize MongoDB connection
 */
async function mongoLoader() {
  try {
    if (isConnected) {
      logger.info('MongoDB already connected');
      return mongoose.connection;
    }

    // Connection options
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds
    };

    // Connect to MongoDB
    await mongoose.connect(config.mongoUri, options);
    
    isConnected = true;
    logger.info({ uri: config.mongoUri.replace(/\/\/.*@/, '//***:***@') }, 'MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (error) => {
      logger.error({ error: error.message }, 'MongoDB connection error');
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (error) {
        logger.error({ error: error.message }, 'Error closing MongoDB connection');
        process.exit(1);
      }
    });

    return mongoose.connection;
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to connect to MongoDB');
    throw error;
  }
}

/**
 * Check MongoDB health
 */
async function checkMongoHealth() {
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      return { status: 'unhealthy', message: 'Not connected to MongoDB' };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return { 
      status: 'healthy', 
      message: 'MongoDB connection is healthy',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      message: `MongoDB health check failed: ${error.message}`,
    };
  }
}

/**
 * Close MongoDB connection
 */
async function closeMongo() {
  try {
    if (isConnected) {
      await mongoose.connection.close();
      isConnected = false;
      logger.info('MongoDB connection closed');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Error closing MongoDB connection');
    throw error;
  }
}

module.exports = {
  mongoLoader,
  checkMongoHealth,
  closeMongo,
  get isConnected() {
    return isConnected;
  },
};
