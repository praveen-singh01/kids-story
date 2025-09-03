const express = require('express');
const { optionalAuth } = require('../middleware/auth');
const { Avatar } = require('../models');
const logger = require('../config/logger');

const router = express.Router();

// GET /avatars - Get available avatar options
router.get('/', optionalAuth, async (req, res) => {
  try {
    const avatars = await Avatar.getActiveAvatars();
    
    res.success(avatars, 'Avatars retrieved successfully');
    
  } catch (error) {
    logger.error('Get avatars error:', error);
    res.status(500).error(['Failed to retrieve avatars'], 'Internal server error');
  }
});

// GET /avatars/:id - Get specific avatar
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const avatar = await Avatar.findOne({ _id: id, isActive: true });
    
    if (!avatar) {
      return res.status(404).error(['Avatar not found'], 'Not found');
    }
    
    res.success(avatar, 'Avatar retrieved successfully');
    
  } catch (error) {
    logger.error('Get avatar error:', error);
    res.status(500).error(['Failed to retrieve avatar'], 'Internal server error');
  }
});

module.exports = router;
