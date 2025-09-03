const express = require('express');
const { query, validationResult } = require('express-validator');
const { optionalAuth, authenticate } = require('../middleware/auth');
const { Category, Content, Progress } = require('../models');
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
const validateLimit = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

// GET /explore/categories - Get browse categories
router.get('/categories', optionalAuth, validateLimit, handleValidationErrors, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const categories = await Category.find({ 
      isActive: true,
      parentId: null // Only get top-level categories
    })
    .select('name imageUrl description sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .limit(parseInt(limit))
    .lean();

    // Transform to match API specification
    const formattedCategories = categories.map(category => ({
      id: category._id,
      name: category.name,
      image: category.imageUrl,
      description: category.description
    }));

    res.success(formattedCategories, 'Categories retrieved successfully');
    
  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).error(['Failed to retrieve categories'], 'Internal server error');
  }
});

// GET /explore/continue - Get continue playing items for user
router.get('/continue', authenticate, validateLimit, handleValidationErrors, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.userId;

    const continueItems = await Progress.getContinuePlayingItems(userId, parseInt(limit));

    // Transform to match API specification
    const formattedItems = continueItems.map(item => {
      const content = item.contentId;
      const progressPercentage = Math.round((item.progress / item.total) * 100);
      
      return {
        id: content._id,
        title: content.title,
        chapter: `${progressPercentage}% complete`, // Could be enhanced with actual chapter info
        progress: item.progress,
        total: item.total,
        image: content.imageUrl
      };
    });

    res.success(formattedItems, 'Continue playing items retrieved successfully');
    
  } catch (error) {
    logger.error('Get continue items error:', error);
    res.status(500).error(['Failed to retrieve continue playing items'], 'Internal server error');
  }
});

// GET /explore/collections - Get featured collections
router.get('/collections', optionalAuth, validateLimit, handleValidationErrors, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // For now, we'll create collections based on content types and tags
    // In a real app, you might have a separate Collections model
    const collections = [];

    // Featured Stories Collection
    const storyCount = await Content.countDocuments({ 
      type: 'story', 
      isActive: true, 
      isFeatured: true 
    });
    
    if (storyCount > 0) {
      const storyImage = await Content.findOne({ 
        type: 'story', 
        isActive: true, 
        isFeatured: true 
      }).select('imageUrl').lean();
      
      collections.push({
        id: 'featured-stories',
        title: 'Featured Stories',
        subtitle: `${storyCount} Stories`,
        image: storyImage?.imageUrl || '/default-story-collection.jpg',
        rating: 4.8
      });
    }

    // Bedtime Collection
    const bedtimeCount = await Content.countDocuments({ 
      tags: 'bedtime', 
      isActive: true 
    });
    
    if (bedtimeCount > 0) {
      const bedtimeImage = await Content.findOne({ 
        tags: 'bedtime', 
        isActive: true 
      }).select('imageUrl').lean();
      
      collections.push({
        id: 'bedtime-collection',
        title: 'Bedtime Stories',
        subtitle: `${bedtimeCount} Sessions`,
        image: bedtimeImage?.imageUrl || '/default-bedtime-collection.jpg',
        rating: 4.9
      });
    }

    // Meditation Collection
    const meditationCount = await Content.countDocuments({ 
      type: 'meditation', 
      isActive: true 
    });
    
    if (meditationCount > 0) {
      const meditationImage = await Content.findOne({ 
        type: 'meditation', 
        isActive: true 
      }).select('imageUrl').lean();
      
      collections.push({
        id: 'mindful-meditation',
        title: 'Mindful Meditation',
        subtitle: `${meditationCount} Sessions`,
        image: meditationImage?.imageUrl || '/default-meditation-collection.jpg',
        rating: 4.7
      });
    }

    // Adventure Collection
    const adventureCount = await Content.countDocuments({ 
      tags: 'adventure', 
      isActive: true 
    });
    
    if (adventureCount > 0) {
      const adventureImage = await Content.findOne({ 
        tags: 'adventure', 
        isActive: true 
      }).select('imageUrl').lean();
      
      collections.push({
        id: 'adventure-stories',
        title: 'Adventure Stories',
        subtitle: `${adventureCount} Stories`,
        image: adventureImage?.imageUrl || '/default-adventure-collection.jpg',
        rating: 4.6
      });
    }

    // Limit results
    const limitedCollections = collections.slice(0, parseInt(limit));

    res.success(limitedCollections, 'Collections retrieved successfully');
    
  } catch (error) {
    logger.error('Get collections error:', error);
    res.status(500).error(['Failed to retrieve collections'], 'Internal server error');
  }
});

// GET /explore/collections/:id - Get content from a specific collection
router.get('/collections/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    let filter = { isActive: true };
    let collectionName = '';

    // Define collection filters
    switch (id) {
      case 'featured-stories':
        filter = { type: 'story', isActive: true, isFeatured: true };
        collectionName = 'Featured Stories';
        break;
      case 'bedtime-collection':
        filter = { tags: 'bedtime', isActive: true };
        collectionName = 'Bedtime Stories';
        break;
      case 'mindful-meditation':
        filter = { type: 'meditation', isActive: true };
        collectionName = 'Mindful Meditation';
        break;
      case 'adventure-stories':
        filter = { tags: 'adventure', isActive: true };
        collectionName = 'Adventure Stories';
        break;
      default:
        return res.status(404).error(['Collection not found'], 'Not found');
    }

    const content = await Content.find(filter)
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Content.countDocuments(filter);

    res.success({
      collection: {
        id,
        name: collectionName,
        total
      },
      content,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, `${collectionName} content retrieved successfully`);
    
  } catch (error) {
    logger.error('Get collection content error:', error);
    res.status(500).error(['Failed to retrieve collection content'], 'Internal server error');
  }
});

module.exports = router;
