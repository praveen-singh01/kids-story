const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { Progress, Content } = require('../models');
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
const validateProgressUpdate = [
  body('contentId')
    .isMongoId()
    .withMessage('Invalid content ID'),
  body('progress')
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Progress must be a non-negative number'),
  body('total')
    .isNumeric()
    .isFloat({ min: 1 })
    .withMessage('Total must be a positive number'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('Completed must be a boolean')
];

const validateContentId = [
  param('contentId')
    .isMongoId()
    .withMessage('Invalid content ID')
];

// POST /progress - Update user progress for content
router.post('/', authenticate, validateProgressUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { contentId, progress, total, completed } = req.body;
    const userId = req.userId;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content || !content.isActive) {
      return res.status(404).error(['Content not found'], 'Progress update failed');
    }

    // Validate progress doesn't exceed total
    if (progress > total) {
      return res.status(400).error(['Progress cannot exceed total duration'], 'Invalid progress data');
    }

    // Update or create progress
    const progressData = await Progress.updateProgress(userId, contentId, {
      progress,
      total,
      completed
    });

    logger.info(`Progress updated: ${contentId} - ${progress}/${total} by user ${userId}`);

    res.success({
      id: progressData._id,
      contentId: progressData.contentId,
      progress: progressData.progress,
      total: progressData.total,
      completed: progressData.completed,
      progressPercentage: progressData.progressPercentage,
      lastPlayedAt: progressData.lastPlayedAt
    }, 'Progress updated successfully');
    
  } catch (error) {
    logger.error('Update progress error:', error);
    res.status(500).error(['Failed to update progress'], 'Internal server error');
  }
});

// GET /progress/:contentId - Get user progress for specific content
router.get('/:contentId', authenticate, validateContentId, handleValidationErrors, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    const progress = await Progress.findOne({ userId, contentId })
      .populate('contentId', 'title type durationSec')
      .lean();

    if (!progress) {
      return res.status(404).error(['Progress not found'], 'No progress found for this content');
    }

    // Calculate progress percentage
    const progressPercentage = Math.round((progress.progress / progress.total) * 100);

    res.success({
      id: progress._id,
      contentId: progress.contentId._id,
      contentTitle: progress.contentId.title,
      contentType: progress.contentId.type,
      progress: progress.progress,
      total: progress.total,
      completed: progress.completed,
      progressPercentage,
      lastPlayedAt: progress.lastPlayedAt,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt
    }, 'Progress retrieved successfully');
    
  } catch (error) {
    logger.error('Get progress error:', error);
    res.status(500).error(['Failed to retrieve progress'], 'Internal server error');
  }
});

// GET /progress - Get all user progress
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0, completed } = req.query;

    const filter = { userId };
    if (completed !== undefined) {
      filter.completed = completed === 'true';
    }

    const progressList = await Progress.find(filter)
      .populate('contentId', 'title type durationSec imageUrl slug')
      .sort({ lastPlayedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    // Transform data
    const formattedProgress = progressList
      .filter(prog => prog.contentId) // Filter out progress for deleted content
      .map(progress => {
        const progressPercentage = Math.round((progress.progress / progress.total) * 100);
        
        return {
          id: progress._id,
          contentId: progress.contentId._id,
          contentTitle: progress.contentId.title,
          contentType: progress.contentId.type,
          contentImage: progress.contentId.imageUrl,
          contentSlug: progress.contentId.slug,
          progress: progress.progress,
          total: progress.total,
          completed: progress.completed,
          progressPercentage,
          lastPlayedAt: progress.lastPlayedAt
        };
      });

    const total = await Progress.countDocuments(filter);

    res.success({
      progress: formattedProgress,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    }, 'Progress list retrieved successfully');
    
  } catch (error) {
    logger.error('Get progress list error:', error);
    res.status(500).error(['Failed to retrieve progress list'], 'Internal server error');
  }
});

// DELETE /progress/:contentId - Reset progress for specific content
router.delete('/:contentId', authenticate, validateContentId, handleValidationErrors, async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    const deletedProgress = await Progress.findOneAndDelete({ userId, contentId });

    if (!deletedProgress) {
      return res.status(404).error(['Progress not found'], 'Reset failed');
    }

    logger.info(`Progress reset: ${contentId} by user ${userId}`);

    res.success(true, 'Progress reset successfully');
    
  } catch (error) {
    logger.error('Reset progress error:', error);
    res.status(500).error(['Failed to reset progress'], 'Internal server error');
  }
});

module.exports = router;
