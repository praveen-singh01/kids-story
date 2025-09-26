const express = require('express');
const multer = require('multer');
const path = require('path');
const AWS = require('aws-sdk');
const { body, query, param } = require('express-validator');
const { Avatar } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Configure AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();
const bucketName = process.env.AWS_S3_BUCKET_NAME;
const cloudFrontDomain = process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN || 'd1ta1qd8y4woyq.cloudfront.net';

// Configure multer for avatar uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    // Allow image files and SVG
    if (file.mimetype.startsWith('image/') || file.mimetype === 'image/svg+xml') {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Validation rules
const validateAvatarCreation = [
  body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['raster', 'svg', 'lottie', 'video']),
  body('bgColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('borderColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('selectionColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('sortOrder').optional().isInt({ min: 0 })
];

const validateAvatarUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('type').optional().isIn(['raster', 'svg', 'lottie', 'video']),
  body('bgColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('borderColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('selectionColorHex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('type').optional().isIn(['raster', 'svg', 'lottie', 'video']),
  query('isActive').optional().isBoolean().toBoolean()
];

// POST /admin/avatars/upload - Upload avatar file
router.post('/upload',
  adminAuth,
  logAdminAction('UPLOAD_AVATAR'),
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).error(['No avatar file uploaded'], 'Avatar upload failed');
      }

      const file = req.file;
      const avatarType = req.body.type || 'raster';

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.originalname);
      const fileName = `avatar_${timestamp}_${randomString}${fileExtension}`;

      // Upload to S3
      const s3Key = `uploads/avatars/${fileName}`;

      const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000' // 1 year cache
      };

      logger.info(`Uploading avatar to S3: ${s3Key} (${file.size} bytes)`);

      const s3Result = await s3.upload(uploadParams).promise();
      const cloudFrontUrl = `https://${cloudFrontDomain}/${s3Key}`;

      logger.info(`Avatar uploaded successfully: ${cloudFrontUrl}`);

      res.success({
        url: cloudFrontUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        type: avatarType,
        s3Location: s3Result.Location
      }, 'Avatar uploaded successfully');

    } catch (error) {
      logger.error('Avatar upload error:', error);
      res.status(500).error(['Failed to upload avatar'], 'Internal server error');
    }
  }
);

// GET /admin/avatars - List all avatars with admin metadata
router.get('/',
  adminAuth,
  logAdminAction('LIST_AVATARS'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
        isActive
      } = req.query;

      // Build filter query - default to showing all avatars for admin
      const filter = {};
      
      if (search) {
        filter.name = { $regex: search, $options: 'i' };
      }
      
      if (type) filter.type = type;
      if (typeof isActive === 'boolean') filter.isActive = isActive;

      const skip = (page - 1) * limit;

      // Get avatars with pagination
      const avatars = await Avatar.find(filter)
        .sort({ sortOrder: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalAvatars = await Avatar.countDocuments(filter);
      const totalPages = Math.ceil(totalAvatars / limit);

      const response = {
        avatars,
        pagination: {
          currentPage: page,
          totalPages,
          totalAvatars,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      res.success(response, 'Avatars retrieved successfully');

    } catch (error) {
      logger.error('Admin get avatars error:', error);
      res.status(500).error(['Failed to retrieve avatars'], 'Internal server error');
    }
  }
);

// GET /admin/avatars/stats - Get avatar statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_AVATAR_STATS'),
  async (req, res) => {
    try {
      const totalAvatars = await Avatar.countDocuments();
      const activeAvatars = await Avatar.countDocuments({ isActive: true });

      // Avatars by type
      const avatarsByType = await Avatar.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      // Most used avatars
      const mostUsedAvatars = await Avatar.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(5)
        .select('name usageCount')
        .lean();

      const stats = {
        totalAvatars,
        activeAvatars,
        inactiveAvatars: totalAvatars - activeAvatars,
        avatarsByType: avatarsByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        mostUsedAvatars
      };

      res.success(stats, 'Avatar statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get avatar stats error:', error);
      res.status(500).error(['Failed to retrieve avatar statistics'], 'Internal server error');
    }
  }
);

// POST /admin/avatars - Create new avatar
router.post('/',
  adminAuth,
  logAdminAction('CREATE_AVATAR'),
  validateAdminRequest(validateAvatarCreation),
  async (req, res) => {
    try {
      const avatarData = req.body;

      const avatar = new Avatar(avatarData);
      await avatar.save();

      logger.info(`New avatar created: ${avatarData.name} by admin ${req.userId}`);

      res.status(201).success(avatar, 'Avatar created successfully');

    } catch (error) {
      logger.error('Admin create avatar error:', error);
      res.status(500).error(['Failed to create avatar'], 'Internal server error');
    }
  }
);

// GET /admin/avatars/:id - Get avatar by ID
router.get('/:id',
  adminAuth,
  logAdminAction('GET_AVATAR'),
  [param('id').isMongoId().withMessage('Invalid avatar ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const avatar = await Avatar.findById(id).lean();

      if (!avatar) {
        return res.status(404).error(['Avatar not found'], 'Avatar not found');
      }

      res.success(avatar, 'Avatar retrieved successfully');

    } catch (error) {
      logger.error('Admin get avatar error:', error);
      res.status(500).error(['Failed to retrieve avatar'], 'Internal server error');
    }
  }
);

// PATCH /admin/avatars/:id - Update avatar
router.patch('/:id',
  adminAuth,
  logAdminAction('UPDATE_AVATAR'),
  [param('id').isMongoId().withMessage('Invalid avatar ID')],
  validateAdminRequest(validateAvatarUpdate),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const avatar = await Avatar.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!avatar) {
        return res.status(404).error(['Avatar not found'], 'Avatar not found');
      }

      res.success(avatar, 'Avatar updated successfully');

    } catch (error) {
      logger.error('Admin update avatar error:', error);
      res.status(500).error(['Failed to update avatar'], 'Internal server error');
    }
  }
);

// DELETE /admin/avatars/:id - Delete avatar (soft delete)
router.delete('/:id',
  adminAuth,
  logAdminAction('DELETE_AVATAR'),
  [param('id').isMongoId().withMessage('Invalid avatar ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const avatar = await Avatar.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!avatar) {
        return res.status(404).error(['Avatar not found'], 'Avatar not found');
      }

      res.success({ deleted: true, avatar }, 'Avatar deleted successfully');

    } catch (error) {
      logger.error('Admin delete avatar error:', error);
      res.status(500).error(['Failed to delete avatar'], 'Internal server error');
    }
  }
);

module.exports = router;
