const express = require('express');
const { contentController } = require('../controllers');
const { 
  authGuard, 
  userRateLimit,
  homeCache 
} = require('../middlewares');
const { 
  validate, 
  homeContentSchema 
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authGuard);
router.use(userRateLimit);

// Get home page content (highlights + recommendations)
router.get('/',
  homeCache,
  validate(homeContentSchema),
  contentController.getHomeContent
);

module.exports = router;
