const express = require('express');
const { query, param } = require('express-validator');
const { Category, Content } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const logger = require('../config/logger');

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  validateRequest(req, res, next);
};

const validateLimit = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('language').optional().isIn(['en', 'hi'])
];

// GET /categories - List active categories for public consumption
router.get('/', optionalAuth, validateLimit, handleValidationErrors, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const categories = await Category.find({ 
      isActive: true,
      parentId: null // Only get top-level categories
    })
    .select('name slug description imageUrl sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .limit(parseInt(limit))
    .lean();

    // Get content count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const contentCount = await Content.countDocuments({ 
          category: category._id, 
          isActive: true 
        });
        
        return {
          id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          contentCount
        };
      })
    );

    res.success(categoriesWithCount, 'Categories retrieved successfully');

  } catch (error) {
    logger.error('Get categories error:', error);
    res.status(500).error(['Failed to retrieve categories'], 'Internal server error');
  }
});

// GET /categories/:slug - Get category by slug with content
router.get('/:slug', optionalAuth, validatePagination, handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 10, language } = req.query;

    // Find category by slug
    const category = await Category.findOne({ 
      slug, 
      isActive: true 
    }).lean();

    if (!category) {
      return res.status(404).error(['Category not found'], 'Category not found');
    }

    // Build content filter
    const contentFilter = { 
      category: category._id, 
      isActive: true 
    };

    // Language filtering
    if (language) {
      contentFilter.availableLanguages = language;
    }

    const skip = (page - 1) * limit;

    // Get content for this category (don't use lean to preserve methods)
    const content = await Content.find(contentFilter)
      .sort({ isFeatured: -1, popularityScore: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform content based on requested language
    const requestedLanguage = language || 'en';
    const transformedContent = content.map(item => {
      // Use the toLanguageJSON method if available, otherwise fallback to manual transformation
      if (typeof item.toLanguageJSON === 'function') {
        return item.toLanguageJSON(requestedLanguage);
      }

      // Manual transformation for backward compatibility
      const languageContent = item.languages && item.languages[requestedLanguage];

      return {
        id: item._id,
        type: item.type,
        title: languageContent?.title || item.title,
        slug: item.slug,
        description: languageContent?.description || item.description,
        durationSec: item.durationSec,
        ageRange: item.ageRange,
        tags: item.tags,
        audioUrl: languageContent?.audioUrl || item.audioUrl,
        imageUrl: languageContent?.imageUrl || item.imageUrl,
        thumbnailUrl: languageContent?.thumbnailUrl || item.thumbnailUrl,
        isFeatured: item.isFeatured,
        popularityScore: item.popularityScore,
        publishedAt: item.publishedAt,
        requestedLanguage
      };
    });

    const totalContent = await Content.countDocuments(contentFilter);

    res.success({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        imageUrl: category.imageUrl
      },
      content: transformedContent,
      pagination: {
        total: totalContent,
        page,
        limit,
        pages: Math.ceil(totalContent / limit),
        hasMore: skip + content.length < totalContent
      },
      language: language || 'en'
    }, 'Category content retrieved successfully');

  } catch (error) {
    logger.error('Get category content error:', error);
    res.status(500).error(['Failed to retrieve category content'], 'Internal server error');
  }
});

// GET /categories/:slug/subcategories - Get subcategories
router.get('/:slug/subcategories', optionalAuth, validateLimit, handleValidationErrors, async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 20 } = req.query;

    // Find parent category by slug
    const parentCategory = await Category.findOne({ 
      slug, 
      isActive: true 
    }).lean();

    if (!parentCategory) {
      return res.status(404).error(['Category not found'], 'Category not found');
    }

    // Get subcategories
    const subcategories = await Category.find({ 
      parentId: parentCategory._id,
      isActive: true
    })
    .select('name slug description imageUrl sortOrder')
    .sort({ sortOrder: 1, name: 1 })
    .limit(parseInt(limit))
    .lean();

    // Get content count for each subcategory
    const subcategoriesWithCount = await Promise.all(
      subcategories.map(async (subcategory) => {
        const contentCount = await Content.countDocuments({ 
          category: subcategory._id, 
          isActive: true 
        });
        
        return {
          id: subcategory._id,
          name: subcategory.name,
          slug: subcategory.slug,
          description: subcategory.description,
          imageUrl: subcategory.imageUrl,
          contentCount
        };
      })
    );

    res.success({
      parentCategory: {
        id: parentCategory._id,
        name: parentCategory.name,
        slug: parentCategory.slug
      },
      subcategories: subcategoriesWithCount
    }, 'Subcategories retrieved successfully');

  } catch (error) {
    logger.error('Get subcategories error:', error);
    res.status(500).error(['Failed to retrieve subcategories'], 'Internal server error');
  }
});

module.exports = router;
