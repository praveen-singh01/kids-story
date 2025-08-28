const express = require('express');

// Import all route modules
const authRoutes = require('./auth');
const kidRoutes = require('./kids');
const contentRoutes = require('./content');
const exploreRoutes = require('./explore');
const homeRoutes = require('./home');
const favoriteRoutes = require('./favorites');
const subscriptionRoutes = require('./subscription');
const paymentRoutes = require('./payment');
const internalRoutes = require('./internal');
const adminRoutes = require('./admin');
const healthRoutes = require('./health');

const router = express.Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/kids', kidRoutes);
router.use('/content', contentRoutes);
router.use('/explore', exploreRoutes);
router.use('/home', homeRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/subscription', subscriptionRoutes);
router.use('/payment', paymentRoutes);
router.use('/internal', internalRoutes);
router.use('/admin', adminRoutes);

// Health routes at root level
router.use('/', healthRoutes);

module.exports = router;
