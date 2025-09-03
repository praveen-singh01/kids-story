const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { User } = require('../models');
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
const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

// GET /users/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    const user = req.user;
    
    res.success(user, 'User profile retrieved successfully');
    
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).error(['Failed to retrieve user profile'], 'Internal server error');
  }
});

// PATCH /users/me - Update current user profile
router.patch('/me', authenticate, validateUserUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.userId;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // If email is being updated, mark as unverified for email provider users
    if (email && req.user.provider === 'email') {
      updateData.emailVerified = false;
      // In a real app, you'd generate a new verification token here
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).error(['User not found'], 'Update failed');
    }
    
    logger.info(`User profile updated: ${user.email}`);
    
    res.success(user, 'User profile updated successfully');
    
  } catch (error) {
    logger.error('Update user profile error:', error);
    
    if (error.code === 11000) {
      return res.status(409).error(['Email already exists'], 'Update failed');
    }
    
    res.status(500).error(['Failed to update user profile'], 'Internal server error');
  }
});

// DELETE /users/me - Delete current user account
router.delete('/me', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Soft delete - mark as inactive instead of actually deleting
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).error(['User not found'], 'Deletion failed');
    }
    
    logger.info(`User account deactivated: ${user.email}`);
    
    res.success({ deleted: true }, 'User account deleted successfully');
    
  } catch (error) {
    logger.error('Delete user account error:', error);
    res.status(500).error(['Failed to delete user account'], 'Internal server error');
  }
});

// GET /users/me/subscription - Get user subscription details
router.get('/me/subscription', authenticate, async (req, res) => {
  try {
    const user = req.user;
    
    res.success({
      subscription: user.subscription,
      plan: user.subscription?.plan || 'free',
      status: user.subscription?.status || 'active'
    }, 'Subscription details retrieved successfully');
    
  } catch (error) {
    logger.error('Get subscription error:', error);
    res.status(500).error(['Failed to retrieve subscription details'], 'Internal server error');
  }
});

module.exports = router;
