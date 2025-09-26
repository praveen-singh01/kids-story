const express = require('express');
const { body, query, param } = require('express-validator');
const { Content } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Validation rules
const validateCollectionUpdate = [
  body('contentIds').isArray().withMessage('Content IDs must be an array'),
  body('contentIds.*').isMongoId().withMessage('Invalid content ID'),
  body('collectionType').isIn(['featured', 'newCollection', 'trending']).withMessage('Invalid collection type')
];

const validateTrendingOrder = [
  body('contentIds').isArray().withMessage('Content IDs must be an array'),
  body('contentIds.*').isMongoId().withMessage('Invalid content ID')
];

// GET /admin/collections/featured - Get featured content collection
router.get('/featured',
  adminAuth,
  logAdminAction('GET_FEATURED_COLLECTION'),
  async (req, res) => {
    try {
      const featuredContent = await Content.find({ 
        isFeatured: true, 
        isActive: true 
      })
      .populate('category', 'name slug imageUrl')
      .sort({ featuredSortOrder: 1, createdAt: -1 })
      .lean();

      res.success({
        collection: 'featured',
        content: featuredContent,
        count: featuredContent.length
      }, 'Featured collection retrieved successfully');

    } catch (error) {
      logger.error('Admin get featured collection error:', error);
      res.status(500).error(['Failed to retrieve featured collection'], 'Internal server error');
    }
  }
);

// GET /admin/collections/new - Get new collection content
router.get('/new',
  adminAuth,
  logAdminAction('GET_NEW_COLLECTION'),
  async (req, res) => {
    try {
      const newContent = await Content.find({ 
        isNewCollection: true, 
        isActive: true 
      })
      .populate('category', 'name slug imageUrl')
      .sort({ newCollectionSortOrder: 1, createdAt: -1 })
      .lean();

      res.success({
        collection: 'newCollection',
        content: newContent,
        count: newContent.length
      }, 'New collection retrieved successfully');

    } catch (error) {
      logger.error('Admin get new collection error:', error);
      res.status(500).error(['Failed to retrieve new collection'], 'Internal server error');
    }
  }
);

// GET /admin/collections/trending - Get trending content collection
router.get('/trending',
  adminAuth,
  logAdminAction('GET_TRENDING_COLLECTION'),
  async (req, res) => {
    try {
      const trendingContent = await Content.find({ 
        isTrendingNow: true, 
        isActive: true 
      })
      .populate('category', 'name slug imageUrl')
      .sort({ trendingSortOrder: 1, createdAt: -1 })
      .lean();

      res.success({
        collection: 'trending',
        content: trendingContent,
        count: trendingContent.length
      }, 'Trending collection retrieved successfully');

    } catch (error) {
      logger.error('Admin get trending collection error:', error);
      res.status(500).error(['Failed to retrieve trending collection'], 'Internal server error');
    }
  }
);

// POST /admin/collections/add-content - Add content to collection
router.post('/add-content',
  adminAuth,
  logAdminAction('ADD_TO_COLLECTION'),
  validateAdminRequest(validateCollectionUpdate),
  async (req, res) => {
    try {
      const { contentIds, collectionType } = req.body;

      // Validate that all content exists
      const existingContent = await Content.find({ 
        _id: { $in: contentIds }, 
        isActive: true 
      });

      if (existingContent.length !== contentIds.length) {
        return res.status(400).error(['Some content items not found or inactive'], 'Content validation failed');
      }

      // Update content based on collection type
      const updateField = {};
      if (collectionType === 'featured') {
        updateField.isFeatured = true;
      } else if (collectionType === 'newCollection') {
        updateField.isNewCollection = true;
      } else if (collectionType === 'trending') {
        updateField.isTrendingNow = true;
      }

      const result = await Content.updateMany(
        { _id: { $in: contentIds } },
        { $set: updateField }
      );

      logger.info(`Content added to ${collectionType} collection by admin ${req.userId}: ${result.modifiedCount} items`);

      res.success({
        addedCount: result.modifiedCount,
        collectionType,
        contentIds
      }, `Content added to ${collectionType} collection successfully`);

    } catch (error) {
      logger.error('Admin add to collection error:', error);
      res.status(500).error(['Failed to add content to collection'], 'Internal server error');
    }
  }
);

// POST /admin/collections/remove-content - Remove content from collection
router.post('/remove-content',
  adminAuth,
  logAdminAction('REMOVE_FROM_COLLECTION'),
  validateAdminRequest(validateCollectionUpdate),
  async (req, res) => {
    try {
      const { contentIds, collectionType } = req.body;

      // Update content based on collection type
      const updateField = {};
      if (collectionType === 'featured') {
        updateField.isFeatured = false;
        updateField.featuredSortOrder = undefined;
      } else if (collectionType === 'newCollection') {
        updateField.isNewCollection = false;
        updateField.newCollectionSortOrder = undefined;
      } else if (collectionType === 'trending') {
        updateField.isTrendingNow = false;
        updateField.trendingSortOrder = undefined;
      }

      const result = await Content.updateMany(
        { _id: { $in: contentIds } },
        { $set: updateField, $unset: { 
          ...(updateField.featuredSortOrder === undefined && { featuredSortOrder: 1 }),
          ...(updateField.newCollectionSortOrder === undefined && { newCollectionSortOrder: 1 }),
          ...(updateField.trendingSortOrder === undefined && { trendingSortOrder: 1 })
        }}
      );

      logger.info(`Content removed from ${collectionType} collection by admin ${req.userId}: ${result.modifiedCount} items`);

      res.success({
        removedCount: result.modifiedCount,
        collectionType,
        contentIds
      }, `Content removed from ${collectionType} collection successfully`);

    } catch (error) {
      logger.error('Admin remove from collection error:', error);
      res.status(500).error(['Failed to remove content from collection'], 'Internal server error');
    }
  }
);

// POST /admin/collections/reorder - Reorder collection content
router.post('/reorder',
  adminAuth,
  logAdminAction('REORDER_COLLECTION'),
  [
    body('contentIds').isArray().withMessage('Content IDs must be an array'),
    body('contentIds.*').isMongoId().withMessage('Invalid content ID'),
    body('collectionType').isIn(['featured', 'newCollection', 'trending']).withMessage('Invalid collection type')
  ],
  async (req, res) => {
    try {
      const { contentIds, collectionType } = req.body;

      // Update sort order for each content item
      const updatePromises = contentIds.map((contentId, index) => {
        const updateData = {};
        
        if (collectionType === 'featured') {
          updateData.featuredSortOrder = index;
        } else if (collectionType === 'newCollection') {
          updateData.newCollectionSortOrder = index;
        } else if (collectionType === 'trending') {
          updateData.trendingSortOrder = index;
        }

        return Content.findByIdAndUpdate(contentId, updateData, { new: true });
      });

      const updatedContent = await Promise.all(updatePromises);

      logger.info(`${collectionType} collection reordered by admin ${req.userId}: ${contentIds.length} items`);

      res.success({
        reorderedCount: updatedContent.length,
        collectionType,
        contentIds
      }, `${collectionType} collection reordered successfully`);

    } catch (error) {
      logger.error('Admin reorder collection error:', error);
      res.status(500).error(['Failed to reorder collection'], 'Internal server error');
    }
  }
);

// GET /admin/collections/stats - Get collection statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_COLLECTION_STATS'),
  async (req, res) => {
    try {
      const featuredCount = await Content.countDocuments({ isFeatured: true, isActive: true });
      const newCollectionCount = await Content.countDocuments({ isNewCollection: true, isActive: true });
      const trendingCount = await Content.countDocuments({ isTrendingNow: true, isActive: true });

      const stats = {
        collections: {
          featured: featuredCount,
          newCollection: newCollectionCount,
          trending: trendingCount
        },
        totalCollectionItems: featuredCount + newCollectionCount + trendingCount
      };

      res.success(stats, 'Collection statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get collection stats error:', error);
      res.status(500).error(['Failed to retrieve collection statistics'], 'Internal server error');
    }
  }
);

module.exports = router;
