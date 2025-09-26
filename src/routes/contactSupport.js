const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const { ContactSupport } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      data: null,
      error: errorMessages,
      message: 'Validation failed'
    });
  }
  next();
};

// Validation middleware for contact support
const validateContactSupport = [
  body('whatsapp')
    .notEmpty()
    .withMessage('WhatsApp number is required')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('WhatsApp number must be 10-15 digits'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/)
    .withMessage('Phone number must be 10-15 digits'),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  handleValidationErrors
];

// @route   GET /api/v1/contact-support
// @desc    Get contact support information
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Find active contact support
    let contactSupport = await ContactSupport.findOne({ isActive: true });

    // If no contact support found, create default one
    if (!contactSupport) {
      // For public endpoint, we need a default admin user ID
      // In production, this should be handled by seeding data
      const defaultAdminId = '507f1f77bcf86cd799439011'; // Placeholder ObjectId
      contactSupport = await ContactSupport.getOrCreateDefault(defaultAdminId);
    }

    res.status(200).json({
      success: true,
      data: contactSupport.toApiResponse(),
      error: [],
      message: 'Contact support fetched'
    });
  } catch (error) {
    logger.error('Get contact support error:', error);
    res.status(500).json({
      success: false,
      data: null,
      error: ['Server error'],
      message: 'Failed to fetch contact support'
    });
  }
});

// @route   POST /api/v1/admin/contact-support
// @desc    Create contact support information
// @access  Private/Admin
router.post('/admin', authenticate, authorize('admin'), validateContactSupport, async (req, res) => {
  try {
    const { whatsapp, phone, email } = req.body;
    
    // Check if contact support already exists
    const existingContactSupport = await ContactSupport.findOne({ isActive: true });

    if (existingContactSupport) {
      return res.status(409).json({
        success: false,
        data: null,
        error: ['Contact support already exists'],
        message: 'Contact support already exists'
      });
    }

    // Create new contact support
    const contactSupport = await ContactSupport.create({
      whatsapp,
      phone,
      email,
      createdBy: req.userId,
      isActive: true
    });

    logger.info('Contact support created:', {
      contactSupportId: contactSupport.id,
      createdBy: req.userId
    });

    res.status(201).json({
      success: true,
      data: contactSupport.toApiResponse(),
      error: [],
      message: 'Contact support created successfully'
    });
  } catch (error) {
    logger.error('Create contact support error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        data: null,
        error: validationErrors,
        message: 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: ['Server error'],
      message: 'Failed to create contact support'
    });
  }
});

// @route   PUT /api/v1/admin/contact-support
// @desc    Update contact support information
// @access  Private/Admin
router.put('/admin', authenticate, authorize('admin'), validateContactSupport, async (req, res) => {
  try {
    const { whatsapp, phone, email } = req.body;
    
    // Find existing contact support
    let contactSupport = await ContactSupport.findOne({ isActive: true });

    if (contactSupport) {
      // Update existing contact support
      contactSupport.whatsapp = whatsapp;
      contactSupport.phone = phone;
      contactSupport.email = email;
      contactSupport.updatedBy = req.userId;
      await contactSupport.save();
    } else {
      // Create new contact support if none exists
      contactSupport = await ContactSupport.create({
        whatsapp,
        phone,
        email,
        createdBy: req.userId,
        isActive: true
      });
    }

    logger.info('Contact support updated:', {
      contactSupportId: contactSupport.id,
      updatedBy: req.userId
    });

    res.status(200).json({
      success: true,
      data: contactSupport.toApiResponse(),
      error: [],
      message: 'Contact support updated successfully'
    });
  } catch (error) {
    logger.error('Update contact support error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        data: null,
        error: validationErrors,
        message: 'Validation failed'
      });
    }

    res.status(500).json({
      success: false,
      data: null,
      error: ['Server error'],
      message: 'Failed to update contact support'
    });
  }
});

module.exports = router;
