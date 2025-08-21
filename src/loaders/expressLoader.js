const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const pinoHttp = require('pino-http');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { requestIdMiddleware, errorHandler, notFoundHandler } = require('../api/v1/middlewares');

/**
 * Initialize Express app with middleware
 */
function expressLoader(app) {
  // Trust proxy for accurate IP addresses
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
  }));

  // Compression
  app.use(compression());

  // Request ID middleware
  app.use(requestIdMiddleware);

  // HTTP logging
  app.use(pinoHttp({
    logger,
    customLogLevel: function (req, res, err) {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    },
    customSuccessMessage: function (req, res) {
      if (res.statusCode === 404) {
        return 'resource not found';
      }
      return `${req.method} ${req.url}`;
    },
    customErrorMessage: function (req, res, err) {
      return `${req.method} ${req.url} - ${err.message}`;
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
        remotePort: req.remotePort,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  }));

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    strict: true,
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
  }));

  // Static file serving for uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1d', // Cache for 1 day
    etag: true,
    lastModified: true,
  }));

  // Health check endpoint (before rate limiting)
  app.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date().toISOString() });
  });

  logger.info('Express middleware loaded successfully');
  
  return app;
}

/**
 * Load error handling middleware (must be called after routes)
 */
function loadErrorHandling(app) {
  // 404 handler for unmatched routes
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  logger.info('Error handling middleware loaded');
}

module.exports = {
  expressLoader,
  loadErrorHandling,
};
