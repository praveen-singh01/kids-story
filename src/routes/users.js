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



const validateOnboarding = [
  body('fullName')
    .notEmpty()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name is required and must be between 2 and 100 characters'),
  body('birthDate.day')
    .isInt({ min: 1, max: 31 })
    .withMessage('Birth day must be between 1 and 31'),
  body('birthDate.month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Birth month must be between 1 and 12'),
  body('birthDate.year')
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Birth year must be between 1900 and ${new Date().getFullYear()}`),
  body('phone')
    .notEmpty()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number is required and must be 10 digits starting with 6-9'),
  body('language')
    .optional()
    .isIn(['en', 'hi'])
    .withMessage('Language must be either "en" or "hi"'),
  body('avatarId')
    .optional()
    .isString()
    .trim()
    .withMessage('Avatar ID must be a string')
];

const validateOnboardingUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('birthDate.day')
    .optional()
    .isInt({ min: 1, max: 31 })
    .withMessage('Birth day must be between 1 and 31'),
  body('birthDate.month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Birth month must be between 1 and 12'),
  body('birthDate.year')
    .optional()
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage(`Birth year must be between 1900 and ${new Date().getFullYear()}`),
  body('phone')
    .optional()
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Phone number must be 10 digits starting with 6-9'),
  body('language')
    .optional()
    .isIn(['en', 'hi'])
    .withMessage('Language must be either "en" or "hi"'),
  body('avatarId')
    .optional()
    .isString()
    .trim()
    .withMessage('Avatar ID must be a string')
];

// GET /users/me - Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    // User is already attached to req by authenticate middleware
    const user = req.user;

    // Ensure preferences object exists with default values
    const userResponse = {
      ...user.toJSON(),
      preferences: {
        language: user.preferences?.language || 'en'
      },
      avatarId: user.avatarId || null
    };

    res.success(userResponse, 'User profile retrieved successfully');

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

    // Return updated user data with preferences
    const userResponse = {
      ...user.toJSON(),
      preferences: {
        language: user.preferences?.language || 'en'
      },
      avatarId: user.avatarId || null
    };

    res.success(userResponse, 'User profile updated successfully');

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

// POST /users/me/onboarding - Complete user onboarding
router.post('/me/onboarding', authenticate, validateOnboarding, handleValidationErrors, async (req, res) => {
  try {
    const { fullName, birthDate, phone, language, avatarId } = req.body;
    const userId = req.userId;

    // Check if user is already onboarded
    if (req.user.isOnboarded) {
      return res.status(400).error(['User has already completed onboarding'], 'Onboarding failed');
    }

    // Validate birth date
    const { day, month, year } = birthDate;
    const birthDateObj = new Date(year, month - 1, day);

    // Check if the date is valid
    if (birthDateObj.getDate() !== day || birthDateObj.getMonth() !== month - 1 || birthDateObj.getFullYear() !== year) {
      return res.status(400).error(['Invalid birth date'], 'Onboarding failed');
    }

    // Prepare update data
    const updateData = {
      fullName,
      birthDate: { day, month, year },
      phone,
      isOnboarded: true
    };

    // Add language preference if provided
    if (language) {
      updateData['preferences.language'] = language;
    }

    // Add avatar ID if provided
    if (avatarId) {
      updateData.avatarId = avatarId;
    }

    // Update user with onboarding data
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).error(['User not found'], 'Onboarding failed');
    }

    logger.info(`User onboarding completed: ${user.email}`);

    // Return updated user data with preferences
    const userResponse = {
      ...user.toJSON(),
      preferences: {
        language: user.preferences?.language || 'en'
      },
      avatarId: user.avatarId || null
    };

    res.success({
      user: userResponse,
      isOnboarded: true
    }, 'Onboarding completed successfully');

  } catch (error) {
    logger.error('Onboarding error:', error);

    if (error.code === 11000) {
      return res.status(409).error(['Phone number already exists'], 'Onboarding failed');
    }

    res.status(500).error(['Failed to complete onboarding'], 'Internal server error');
  }
});

// GET /users/me/onboarding-status - Check if user has completed onboarding
router.get('/me/onboarding-status', authenticate, async (req, res) => {
  try {
    const user = req.user;

    res.success({
      isOnboarded: user.isOnboarded || false,
      hasFullName: !!user.fullName,
      hasBirthDate: !!(user.birthDate && user.birthDate.day && user.birthDate.month && user.birthDate.year),
      hasPhone: !!user.phone
    }, 'Onboarding status retrieved successfully');

  } catch (error) {
    logger.error('Get onboarding status error:', error);
    res.status(500).error(['Failed to retrieve onboarding status'], 'Internal server error');
  }
});

// PUT /users/me/onboarding - Update user onboarding details
router.put('/me/onboarding', authenticate, validateOnboardingUpdate, handleValidationErrors, async (req, res) => {
  try {
    const { fullName, birthDate, phone, language, avatarId } = req.body;
    const userId = req.userId;

    // Check if user has completed onboarding
    if (!req.user.isOnboarded) {
      return res.status(400).error(['User must complete onboarding first'], 'Update failed');
    }

    const updateData = {};

    // Update full name if provided
    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    // Update birth date if provided (must provide all three fields)
    if (birthDate) {
      const { day, month, year } = birthDate;

      // If any birth date field is provided, all must be provided
      if (day !== undefined || month !== undefined || year !== undefined) {
        if (day === undefined || month === undefined || year === undefined) {
          return res.status(400).error(['Birth date must include day, month, and year'], 'Update failed');
        }

        // Validate birth date
        const birthDateObj = new Date(year, month - 1, day);
        if (birthDateObj.getDate() !== day || birthDateObj.getMonth() !== month - 1 || birthDateObj.getFullYear() !== year) {
          return res.status(400).error(['Invalid birth date'], 'Update failed');
        }

        updateData.birthDate = { day, month, year };
      }
    }

    // Update phone if provided
    if (phone !== undefined) {
      updateData.phone = phone;
    }

    // Update language preference if provided
    if (language !== undefined) {
      updateData['preferences.language'] = language;
    }

    // Update avatar ID if provided
    if (avatarId !== undefined) {
      updateData.avatarId = avatarId;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).error(['No valid fields provided for update'], 'Update failed');
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).error(['User not found'], 'Update failed');
    }

    logger.info(`User onboarding details updated: ${user.email}`);

    // Return updated user data with preferences
    const userResponse = {
      ...user.toJSON(),
      preferences: {
        language: user.preferences?.language || 'en'
      },
      avatarId: user.avatarId || null
    };

    res.success({
      user: userResponse,
      updated: Object.keys(updateData)
    }, 'Onboarding details updated successfully');

  } catch (error) {
    logger.error('Update onboarding error:', error);

    if (error.code === 11000) {
      return res.status(409).error(['Phone number already exists'], 'Update failed');
    }

    res.status(500).error(['Failed to update onboarding details'], 'Internal server error');
  }
});

module.exports = router;
