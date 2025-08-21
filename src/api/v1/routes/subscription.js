const express = require('express');
const { subscriptionController } = require('../controllers');
const { 
  authGuard, 
  adminGuard, 
  userRateLimit, 
  writeSlowDown 
} = require('../middlewares');
const { 
  validate, 
  checkoutSchema 
} = require('../validators');

const router = express.Router();

// Protected routes
router.use(authGuard);
router.use(userRateLimit);

// Get current user's subscription
router.get('/',
  subscriptionController.getSubscription
);

// Create checkout session
router.post('/checkout',
  writeSlowDown,
  validate(checkoutSchema),
  subscriptionController.createCheckout
);

// Cancel subscription
router.post('/cancel',
  writeSlowDown,
  subscriptionController.cancelSubscription
);

// Admin routes
router.get('/admin/stats',
  adminGuard,
  subscriptionController.getSubscriptionStats
);

module.exports = router;
