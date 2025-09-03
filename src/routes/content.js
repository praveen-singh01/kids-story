const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const { Content } = require('../models');
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
const validateContentQuery = [
  query('ageRange')
    .optional()
    .isIn(['3-5', '6-8', '9-12'])
    .withMessage('Age range must be one of: 3-5, 6-8, 9-12'),
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  query('type')
    .optional()
    .isIn(['story', 'meditation', 'affirmation', 'sound'])
    .withMessage('Type must be one of: story, meditation, affirmation, sound')
];

const validateSearchQuery = [
  query('query')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

const validateSlug = [
  param('slug')
    .isString()
    .isLength({ min: 1, max: 200 })
    .withMessage('Invalid slug')
];

// GET /content - List content items with filtering
router.get('/', optionalAuth, validateContentQuery, handleValidationErrors, async (req, res) => {
  try {
    const {
      ageRange,
      tags,
      type,
      limit = 20,
      offset = 0
    } = req.query;

    // Build filter query
    const filter = { isActive: true };
    
    if (ageRange) {
      filter.ageRange = ageRange;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    // Execute query with pagination
    const content = await Content.find(filter)
      .sort({ isFeatured: -1, popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean(); // Use lean() for better performance

    // Get total count for pagination
    const total = await Content.countDocuments(filter);

    res.success({
      content,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, 'Content retrieved successfully');
    
  } catch (error) {
    logger.error('Get content error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

// GET /content/search - Search content by query
router.get('/search', optionalAuth, validateSearchQuery, handleValidationErrors, async (req, res) => {
  try {
    const { query: searchQuery, limit = 20 } = req.query;

    // Use MongoDB text search
    const content = await Content.find({
      $and: [
        { isActive: true },
        {
          $text: { 
            $search: searchQuery,
            $caseSensitive: false
          }
        }
      ]
    })
    .select('title slug type durationSec ageRange tags audioUrl imageUrl isFeatured popularityScore publishedAt')
    .sort({ score: { $meta: 'textScore' }, popularityScore: -1 })
    .limit(parseInt(limit))
    .lean();

    res.success(content, 'Search results retrieved successfully');
    
  } catch (error) {
    logger.error('Search content error:', error);
    res.status(500).error(['Failed to search content'], 'Internal server error');
  }
});

// GET /content/featured - Get featured content
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const content = await Content.find({ 
      isActive: true, 
      isFeatured: true 
    })
    .sort({ popularityScore: -1, publishedAt: -1 })
    .limit(parseInt(limit))
    .lean();

    res.success(content, 'Featured content retrieved successfully');
    
  } catch (error) {
    logger.error('Get featured content error:', error);
    res.status(500).error(['Failed to retrieve featured content'], 'Internal server error');
  }
});

// GET /content/:slug - Get content item by slug
router.get('/:slug', optionalAuth, validateSlug, handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;

    const content = await Content.findOne({ 
      slug, 
      isActive: true 
    }).lean();

    if (!content) {
      return res.status(404).error(['Content not found'], 'Not found');
    }

    // Increment view count (fire and forget)
    Content.findByIdAndUpdate(content._id, { $inc: { viewCount: 1 } }).exec();

    res.success(content, 'Content retrieved successfully');
    
  } catch (error) {
    logger.error('Get content by slug error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

// GET /content/type/:type - Get content by type
router.get('/type/:type', optionalAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, offset = 0, ageRange } = req.query;

    if (!['story', 'meditation', 'affirmation', 'sound'].includes(type)) {
      return res.status(400).error(['Invalid content type'], 'Bad request');
    }

    const filter = { isActive: true, type };
    if (ageRange) {
      filter.ageRange = ageRange;
    }

    const content = await Content.find(filter)
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    const total = await Content.countDocuments(filter);

    res.success({
      content,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, `${type} content retrieved successfully`);
    
  } catch (error) {
    logger.error('Get content by type error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

module.exports = router;
