const express = require('express');
const mongoose = require('mongoose');
const { version } = require('../../package.json');

const router = express.Router();

// GET /health - System health check
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic system info
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown'
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };

    // If database is not connected, mark as unhealthy
    if (dbStatus !== 'connected') {
      healthData.status = 'unhealthy';
      return res.status(503).success(healthData, 'Service unhealthy');
    }

    res.success(healthData, 'Service healthy');
    
  } catch (error) {
    res.status(503).success({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version,
      error: error.message
    }, 'Health check failed');
  }
});

// GET /health/detailed - Detailed health check (for monitoring)
router.get('/detailed', async (req, res) => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // Check if all systems are operational
    const isHealthy = mongoose.connection.readyState === 1;
    
    if (!isHealthy) {
      healthData.status = 'unhealthy';
      return res.status(503).success(healthData, 'Service unhealthy');
    }

    res.success(healthData, 'Detailed health check completed');
    
  } catch (error) {
    res.status(503).success({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version,
      error: error.message
    }, 'Detailed health check failed');
  }
});

module.exports = router;
