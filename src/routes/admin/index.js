const express = require('express');
const usersRouter = require('./users');
const contentRouter = require('./content');
const categoriesRouter = require('./categories');
const analyticsRouter = require('./analytics');
const paymentRouter = require('./payment');
const systemRouter = require('./system');

const router = express.Router();

// Mount admin sub-routes
router.use('/users', usersRouter);
router.use('/content', contentRouter);
router.use('/categories', categoriesRouter);
router.use('/analytics', analyticsRouter);
router.use('/payment', paymentRouter);
router.use('/system', systemRouter);

// Admin health check endpoint
router.get('/health', (req, res) => {
  res.success({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }, 'Admin API is healthy');
});

module.exports = router;
