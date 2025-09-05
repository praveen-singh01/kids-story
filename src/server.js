const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const responseFormatter = require('./middleware/responseFormatter');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const kidRoutes = require('./routes/kids');
const contentRoutes = require('./routes/content');
const avatarRoutes = require('./routes/avatars');
const exploreRoutes = require('./routes/explore');
const favoriteRoutes = require('./routes/favorites');
const progressRoutes = require('./routes/progress');
const subscriptionRoutes = require('./routes/subscriptions');
const paymentRoutes = require('./routes/payment');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    error: ['Too many requests from this IP, please try again later.'],
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Response formatter middleware
app.use(responseFormatter);

// API routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/kids`, kidRoutes);
app.use(`/api/${API_VERSION}/content`, contentRoutes);
app.use(`/api/${API_VERSION}/avatars`, avatarRoutes);
app.use(`/api/${API_VERSION}/explore`, exploreRoutes);
app.use(`/api/${API_VERSION}/favorites`, favoriteRoutes);
app.use(`/api/${API_VERSION}/progress`, progressRoutes);
app.use(`/api/${API_VERSION}/subscriptions`, subscriptionRoutes);
app.use(`/api/${API_VERSION}/payment`, paymentRoutes);
app.use(`/api/${API_VERSION}/health`, healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.success({
    message: 'Kids Story App API',
    version: API_VERSION,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).error(['Endpoint not found'], 'The requested endpoint does not exist');
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`🚀 Kids Story API server running on port ${PORT}`);
    logger.info(`📚 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🔗 API Base URL: http://localhost:${PORT}/api/${API_VERSION}`);
  });
}

module.exports = app;
