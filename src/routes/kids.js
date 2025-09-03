const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { Kid } = require('../models');
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
const validateKidCreation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('ageRange')
    .isIn(['3-5', '6-8', '9-12'])
    .withMessage('Age range must be one of: 3-5, 6-8, 9-12'),
  body('avatarKey')
    .optional()
    .isString()
    .withMessage('Avatar key must be a string')
];

const validateKidUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('ageRange')
    .optional()
    .isIn(['3-5', '6-8', '9-12'])
    .withMessage('Age range must be one of: 3-5, 6-8, 9-12'),
  body('avatarKey')
    .optional()
    .isString()
    .withMessage('Avatar key must be a string')
];

const validateKidId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid kid ID')
];

// GET /kids - List all kid profiles for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    const kids = await Kid.find({ 
      userId, 
      isActive: true 
    }).sort({ createdAt: -1 });
    
    res.success(kids, 'Kid profiles retrieved successfully');
    
  } catch (error) {
    logger.error('Get kids error:', error);
    res.status(500).error(['Failed to retrieve kid profiles'], 'Internal server error');
  }
});

// POST /kids - Create a new kid profile
router.post('/', authenticate, validateKidCreation, handleValidationErrors, async (req, res) => {
  try {
    const { name, ageRange, avatarKey } = req.body;
    const userId = req.userId;
    
    const kid = new Kid({
      userId,
      name,
      ageRange,
      avatarKey
    });
    
    await kid.save();
    
    logger.info(`New kid profile created: ${name} for user ${userId}`);
    
    res.status(201).success(kid, 'Kid profile created successfully');
    
  } catch (error) {
    logger.error('Create kid error:', error);
    
    if (error.message === 'Maximum number of kid profiles (5) reached') {
      return res.status(400).error([error.message], 'Creation failed');
    }
    
    res.status(500).error(['Failed to create kid profile'], 'Internal server error');
  }
});

// GET /kids/:id - Get a specific kid profile
router.get('/:id', authenticate, validateKidId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const kid = await Kid.findOne({ 
      _id: id, 
      userId, 
      isActive: true 
    });
    
    if (!kid) {
      return res.status(404).error(['Kid profile not found'], 'Not found');
    }
    
    res.success(kid, 'Kid profile retrieved successfully');
    
  } catch (error) {
    logger.error('Get kid error:', error);
    res.status(500).error(['Failed to retrieve kid profile'], 'Internal server error');
  }
});

// PATCH /kids/:id - Update kid profile
router.patch('/:id', authenticate, validateKidId, validateKidUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, ageRange, avatarKey } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (ageRange) updateData.ageRange = ageRange;
    if (avatarKey !== undefined) updateData.avatarKey = avatarKey;
    
    const kid = await Kid.findOneAndUpdate(
      { _id: id, userId, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!kid) {
      return res.status(404).error(['Kid profile not found'], 'Update failed');
    }
    
    logger.info(`Kid profile updated: ${kid.name} (${id})`);
    
    res.success(kid, 'Kid profile updated successfully');
    
  } catch (error) {
    logger.error('Update kid error:', error);
    res.status(500).error(['Failed to update kid profile'], 'Internal server error');
  }
});

// DELETE /kids/:id - Delete kid profile
router.delete('/:id', authenticate, validateKidId, handleValidationErrors, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    // Soft delete - mark as inactive
    const kid = await Kid.findOneAndUpdate(
      { _id: id, userId, isActive: true },
      { isActive: false },
      { new: true }
    );
    
    if (!kid) {
      return res.status(404).error(['Kid profile not found'], 'Deletion failed');
    }
    
    logger.info(`Kid profile deleted: ${kid.name} (${id})`);
    
    res.success(true, 'Kid profile deleted successfully');
    
  } catch (error) {
    logger.error('Delete kid error:', error);
    res.status(500).error(['Failed to delete kid profile'], 'Internal server error');
  }
});

module.exports = router;
