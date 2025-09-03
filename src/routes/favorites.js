const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { Favorite, Content } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).error(errorMessages, 'Validation failed');
  }
  next();
};

// Validation middleware
const validateAddFavorite = [
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  body('contentType')
    .isIn(['story', 'lesson', 'meditation', 'affirmation', 'sound'])
    .withMessage('Content type must be one of: story, lesson, meditation, affirmation, sound')
];

const validateFavoriteId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid favorite ID')
];

// GET /favorites - Get user's favorite items
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const favorites = await Favorite.find({ userId })
      .populate('contentId', 'title slug type imageUrl durationSec ageRange tags')
      .sort({ savedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Transform to match API specification
    const formattedFavorites = favorites
      .filter(fav => fav.contentId) // Filter out favorites with deleted content
      .map(favorite => ({
        id: favorite._id,
        title: favorite.contentId.title,
        subtitle: `${Math.floor(favorite.contentId.durationSec / 60)} min • ${favorite.contentId.type}`,
        image: favorite.contentId.imageUrl,
        source: favorite.contentType,
        savedAt: favorite.savedAt,
        contentId: favorite.contentId._id,
        slug: favorite.contentId.slug
      }));

    const total = await Favorite.countDocuments({ userId });

    res.success({
      favorites: formattedFavorites,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, 'Favorites retrieved successfully');
    
  } catch (error) {
    logger.error('Get favorites error:', error);
    res.status(500).error(['Failed to retrieve favorites'], 'Internal server error');
  }
});

// POST /favorites - Add item to favorites
router.post('/', authenticate, validateAddFavorite, handleValidationErrors, async (req, res) => {
  try {
    const { contentId, contentType } = req.body;
    const userId = req.userId;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content || !content.isActive) {
      return res.status(404).error(['Content not found'], 'Add to favorites failed');
    }

    // Toggle favorite (add or remove)
    const result = await Favorite.toggleFavorite(userId, contentId, contentType);

    if (result.action === 'added') {
      // Populate the favorite with content details
      const populatedFavorite = await Favorite.findById(result.favorite._id)
        .populate('contentId', 'title slug type imageUrl durationSec ageRange tags')
        .lean();

      const formattedFavorite = {
        id: populatedFavorite._id,
        title: populatedFavorite.contentId.title,
        subtitle: `${Math.floor(populatedFavorite.contentId.durationSec / 60)} min • ${populatedFavorite.contentId.type}`,
        image: populatedFavorite.contentId.imageUrl,
        source: populatedFavorite.contentType,
        savedAt: populatedFavorite.savedAt,
        contentId: populatedFavorite.contentId._id,
        slug: populatedFavorite.contentId.slug
      };

      logger.info(`Content added to favorites: ${contentId} by user ${userId}`);
      
      res.status(201).success({
        favorite: formattedFavorite,
        action: 'added'
      }, 'Added to favorites successfully');
    } else {
      logger.info(`Content removed from favorites: ${contentId} by user ${userId}`);
      
      res.success({
        favorite: null,
        action: 'removed'
      }, 'Removed from favorites successfully');
    }
    
  } catch (error) {
    logger.error('Add/remove favorite error:', error);
    res.status(500).error(['Failed to update favorites'], 'Internal server error');
  }
});

// DELETE /favorites/:id - Remove item from favorites
router.delete('/:id', authenticate, validateFavoriteId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const favorite = await Favorite.findOneAndDelete({ 
      _id: id, 
      userId 
    });

    if (!favorite) {
      return res.status(404).error(['Favorite not found'], 'Removal failed');
    }

    // Decrement favorite count in Content model
    await Content.findByIdAndUpdate(favorite.contentId, { 
      $inc: { favoriteCount: -1 } 
    });

    logger.info(`Favorite removed: ${id} by user ${userId}`);

    res.success(true, 'Removed from favorites successfully');
    
  } catch (error) {
    logger.error('Remove favorite error:', error);
    res.status(500).error(['Failed to remove from favorites'], 'Internal server error');
  }
});

// GET /favorites/check/:contentId - Check if content is favorited
router.get('/check/:contentId', authenticate, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    if (!contentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).error(['Invalid content ID'], 'Bad request');
    }

    const favorite = await Favorite.findOne({ userId, contentId });

    res.success({
      isFavorited: !!favorite,
      favoriteId: favorite?._id || null
    }, 'Favorite status retrieved successfully');
    
  } catch (error) {
    logger.error('Check favorite error:', error);
    res.status(500).error(['Failed to check favorite status'], 'Internal server error');
  }
});

module.exports = router;
