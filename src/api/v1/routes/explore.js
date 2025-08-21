const express = require('express');
const { contentController } = require('../controllers');
const { 
  publicRateLimit, 
  optionalAuthGuard,
  exploreCache 
} = require('../middlewares');
const { 
  validate, 
  exploreListSchema, 
  searchContentSchema 
} = require('../validators');

const router = express.Router();

// All routes are public with optional auth
router.use(publicRateLimit);
router.use(optionalAuthGuard);

// Get content categories
router.get('/categories',
  exploreCache,
  contentController.getCategories
);

// Get content list with filters and pagination
router.get('/list',
  exploreCache,
  validate(exploreListSchema),
  contentController.getContentList
);

// Search content
router.get('/search',
  validate(searchContentSchema),
  contentController.searchContent
);

module.exports = router;
