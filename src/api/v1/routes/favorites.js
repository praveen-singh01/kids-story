const express = require('express');
const { favoriteController } = require('../controllers');
const { 
  authGuard, 
  adminGuard, 
  userRateLimit, 
  writeSlowDown,
  favoritesCache 
} = require('../middlewares');
const { 
  validate, 
  addFavoriteSchema, 
  removeFavoriteSchema, 
  getFavoritesSchema,
  bulkAddFavoritesSchema,
  kidIdSchema 
} = require('../validators');

const router = express.Router();

// All routes require authentication
router.use(authGuard);
router.use(userRateLimit);

// Get favorites (for user or specific kid)
router.get('/',
  favoritesCache,
  validate(getFavoritesSchema),
  favoriteController.getFavorites
);

// Add content to favorites
router.post('/',
  writeSlowDown,
  validate(addFavoriteSchema),
  favoriteController.addFavorite
);

// Bulk add favorites
router.post('/bulk',
  writeSlowDown,
  validate(bulkAddFavoritesSchema),
  favoriteController.bulkAddFavorites
);

// Check if content is favorited
router.get('/check/:contentId',
  validate(removeFavoriteSchema),
  favoriteController.checkFavorite
);

// Remove content from favorites
router.delete('/:contentId',
  writeSlowDown,
  validate(removeFavoriteSchema),
  favoriteController.removeFavorite
);

// Get favorite statistics for current user
router.get('/stats',
  favoriteController.getFavoriteStats
);

// Remove all favorites for a kid
router.delete('/kids/:id/all',
  writeSlowDown,
  validate(kidIdSchema),
  favoriteController.removeAllKidFavorites
);

// Admin routes
router.get('/admin/most-favorited',
  adminGuard,
  favoriteController.getMostFavorited
);

module.exports = router;
