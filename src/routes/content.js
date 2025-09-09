const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { optionalAuth } = require('../middleware/auth');
const {
  validateLanguage,
  setDefaultLanguage,
  normalizeLanguage,
  addLocalizedErrorHelper
} = require('../middleware/language');
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

// Helper function to format content with language support
const formatContentWithLanguage = (content, language = 'en') => {
  if (Array.isArray(content)) {
    return content.map(item => {
      if (typeof item.toLanguageJSON === 'function') {
        return item.toLanguageJSON(language);
      }
      return item;
    });
  } else {
    if (typeof content.toLanguageJSON === 'function') {
      return content.toLanguageJSON(language);
    }
    return content;
  }
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
    .withMessage('Type must be one of: story, meditation, affirmation, sound'),
  ...validateLanguage
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
router.get('/', optionalAuth, validateContentQuery, handleValidationErrors, setDefaultLanguage, normalizeLanguage, addLocalizedErrorHelper, async (req, res) => {
  try {
    const {
      ageRange,
      tags,
      type,
      language = 'en',
      limit = 20,
      offset = 0,
      newcollection,
      trendingnow
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

    // Filter by available languages if language is specified
    if (language) {
      filter.availableLanguages = language;
    }

    // Filter by new collection
    if (newcollection === 'true') {
      filter.isNewCollection = true;
    }

    // Filter by trending now
    if (trendingnow === 'true') {
      filter.isTrendingNow = true;
    }

    // Execute query with pagination (don't use lean() to preserve methods)
    const content = await Content.find(filter)
      .sort({ isFeatured: -1, popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    // Get total count for pagination
    const total = await Content.countDocuments(filter);

    // Format content with language-specific data
    const formattedContent = formatContentWithLanguage(content, language);

    res.success({
      content: formattedContent,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      language: language
    }, 'Content retrieved successfully');

  } catch (error) {
    logger.error('Get content error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

// GET /content/search - Search content by query
router.get('/search', optionalAuth, validateSearchQuery, handleValidationErrors, async (req, res) => {
  try {
    const { query: searchQuery, limit = 20, language = 'en' } = req.query;

    // Build search filter
    const searchFilter = {
      $and: [
        { isActive: true },
        {
          $text: {
            $search: searchQuery,
            $caseSensitive: false
          }
        }
      ]
    };

    // Filter by available languages if language is specified
    if (language) {
      searchFilter.$and.push({ availableLanguages: language });
    }

    // Use MongoDB text search
    const content = await Content.find(searchFilter)
      .select('title slug type durationSec ageRange tags audioUrl imageUrl isFeatured popularityScore publishedAt languages defaultLanguage availableLanguages')
      .sort({ score: { $meta: 'textScore' }, popularityScore: -1 })
      .limit(parseInt(limit));

    // Format content with language-specific data
    const formattedContent = formatContentWithLanguage(content, language);

    res.success({
      content: formattedContent,
      language: language
    }, 'Search results retrieved successfully');

  } catch (error) {
    logger.error('Search content error:', error);
    res.status(500).error(['Failed to search content'], 'Internal server error');
  }
});

// GET /content/languages - Get available languages
router.get('/languages', async (req, res) => {
  try {
    // Get distinct available languages from all active content
    const languages = await Content.distinct('availableLanguages', { isActive: true });

    // Ensure 'en' is always included as it's the default
    const uniqueLanguages = [...new Set(['en', ...languages])];

    // Language metadata
    const languageInfo = {
      en: { name: 'English', nativeName: 'English' },
      hi: { name: 'Hindi', nativeName: 'हिन्दी' }
    };

    const result = uniqueLanguages.map(lang => ({
      code: lang,
      ...languageInfo[lang]
    }));

    res.success(result, 'Available languages retrieved successfully');

  } catch (error) {
    logger.error('Get available languages error:', error);
    res.status(500).error(['Failed to retrieve available languages'], 'Internal server error');
  }
});

// GET /content/featured - Get featured content
router.get('/featured', optionalAuth, async (req, res) => {
  try {
    const { limit = 10, language = 'en' } = req.query;

    // Build filter
    const filter = {
      isActive: true,
      isFeatured: true
    };

    // Filter by available languages if language is specified
    if (language) {
      filter.availableLanguages = language;
    }

    const content = await Content.find(filter)
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit));

    // Format content with language-specific data
    const formattedContent = formatContentWithLanguage(content, language);

    res.success({
      content: formattedContent,
      language: language
    }, 'Featured content retrieved successfully');

  } catch (error) {
    logger.error('Get featured content error:', error);
    res.status(500).error(['Failed to retrieve featured content'], 'Internal server error');
  }
});

// GET /content/:slug - Get content item by slug
router.get('/:slug', optionalAuth, validateLanguage, validateSlug, handleValidationErrors, setDefaultLanguage, normalizeLanguage, addLocalizedErrorHelper, async (req, res) => {
  try {
    const { slug } = req.params;
    const { language = 'en' } = req.query;

    const content = await Content.findOne({
      slug,
      isActive: true
    });

    if (!content) {
      return res.localizedError('content_not_found', 404);
    }

    // Check if requested language is available
    if (language !== 'en' && !content.availableLanguages.includes(language)) {
      return res.localizedError('language_not_supported', 400);
    }

    // Increment view count (fire and forget)
    Content.findByIdAndUpdate(content._id, { $inc: { viewCount: 1 } }).exec();

    // Format content with language-specific data
    const formattedContent = formatContentWithLanguage(content, language);

    res.success(formattedContent, 'Content retrieved successfully');

  } catch (error) {
    logger.error('Get content by slug error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

// GET /content/type/:type - Get content by type
router.get('/type/:type', optionalAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 20, offset = 0, ageRange, language = 'en' } = req.query;

    if (!['story', 'meditation', 'affirmation', 'sound'].includes(type)) {
      return res.status(400).error(['Invalid content type'], 'Bad request');
    }

    const filter = { isActive: true, type };
    if (ageRange) {
      filter.ageRange = ageRange;
    }

    // Filter by available languages if language is specified
    if (language) {
      filter.availableLanguages = language;
    }

    const content = await Content.find(filter)
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Content.countDocuments(filter);

    // Format content with language-specific data
    const formattedContent = formatContentWithLanguage(content, language);

    res.success({
      content: formattedContent,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      language: language
    }, `${type} content retrieved successfully`);

  } catch (error) {
    logger.error('Get content by type error:', error);
    res.status(500).error(['Failed to retrieve content'], 'Internal server error');
  }
});

module.exports = router;
