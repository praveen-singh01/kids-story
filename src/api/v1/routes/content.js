const express = require('express');
const { contentController } = require('../controllers');
const { 
  authGuard, 
  optionalAuthGuard, 
  adminGuard, 
  publicRateLimit, 
  userRateLimit,
  contentCache,
  exploreCache 
} = require('../middlewares');
const { 
  validate, 
  contentSlugSchema, 
  incrementPopularitySchema 
} = require('../validators');

const router = express.Router();

// Public routes with optional auth
router.get('/categories',
  publicRateLimit,
  contentCache,
  contentController.getCategories
);

// Get content by slug
router.get('/:slug',
  publicRateLimit,
  optionalAuthGuard,
  contentCache,
  validate(contentSlugSchema),
  contentController.getContent
);

// Increment content popularity (requires auth)
router.post('/:slug/play',
  authGuard,
  userRateLimit,
  validate(incrementPopularitySchema),
  contentController.incrementPopularity
);

// Admin only routes
router.get('/admin/stats',
  authGuard,
  adminGuard,
  contentController.getContentStats
);

module.exports = router;
