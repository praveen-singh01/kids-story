const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, query, param } = require('express-validator');
const { Content, Progress, Favorite } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow audio and image files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and image files are allowed'), false);
    }
  }
});

// Validation rules
const validateContentCreation = [
  body('title').notEmpty().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('type').isIn(['story', 'meditation', 'sound']),
  body('ageRange').isIn(['3-5', '6-8', '9-12', '13+']),
  body('language').isIn(['en', 'hi']),
  body('audioUrl').notEmpty().isURL(),
  body('imageUrl').notEmpty().isURL(),
  body('durationSec').isInt({ min: 1 }),
  body('featured').optional().isBoolean(),
  body('isNewCollection').optional().isBoolean(),
  body('isTrendingNow').optional().isBoolean()
];

const validateContentUpdate = [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('type').optional().isIn(['story', 'meditation', 'sound']),
  body('ageRange').optional().isIn(['3-5', '6-8', '9-12', '13+']),
  body('language').optional().isIn(['en', 'hi']),
  body('audioUrl').optional().isURL(),
  body('imageUrl').optional().isURL(),
  body('durationSec').optional().isInt({ min: 1 }),
  body('featured').optional().isBoolean(),
  body('isNewCollection').optional().isBoolean(),
  body('isTrendingNow').optional().isBoolean(),
  body('isActive').optional().isBoolean()
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('type').optional().isIn(['story', 'meditation', 'sound']),
  query('language').optional().isIn(['en', 'hi']),
  query('featured').optional().isBoolean().toBoolean(),
  query('ageRange').optional().isIn(['3-5', '6-8', '9-12', '13+'])
];

// POST /admin/content/upload - Upload files (audio/image)
router.post('/upload',
  adminAuth,
  logAdminAction('UPLOAD_CONTENT_FILE'),
  upload.single('file'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).error(['No file uploaded'], 'File upload failed');
      }

      const file = req.file;
      const fileType = req.body.type || 'unknown';

      // Generate unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileType}_${timestamp}_${randomString}${fileExtension}`;

      // For now, we'll simulate file upload and return a mock URL
      // In a real implementation, this would upload to AWS S3
      const mockUrl = `https://d1ta1qd8y4woyq.cloudfront.net/uploads/${fileType}/${fileName}`;

      logger.info(`File uploaded: ${fileName} (${file.size} bytes)`);

      res.success({
        url: mockUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        type: fileType
      }, 'File uploaded successfully');

    } catch (error) {
      logger.error('File upload error:', error);
      res.status(500).error(['Failed to upload file'], 'Internal server error');
    }
  }
);

// GET /admin/content - List all content with admin metadata
router.get('/',
  adminAuth,
  logAdminAction('LIST_CONTENT'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        type,
        language,
        featured,
        ageRange,
        newcollection,
        trendingnow
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (search) {
        filter.$or = [
          { 'content.en.title': { $regex: search, $options: 'i' } },
          { 'content.hi.title': { $regex: search, $options: 'i' } },
          { 'content.en.description': { $regex: search, $options: 'i' } },
          { 'content.hi.description': { $regex: search, $options: 'i' } }
        ];
      }
      
      if (type) filter.type = type;
      if (ageRange) filter.ageRange = ageRange;
      if (typeof featured === 'boolean') filter.featured = featured;

      // Language filtering - only show content that has the requested language
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

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get content with pagination
      const content = await Content.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      // Get total count for pagination
      const totalContent = await Content.countDocuments(filter);
      const totalPages = Math.ceil(totalContent / limit);

      // Add analytics data for each content item
      const enrichedContent = await Promise.all(content.map(async (item) => {
        const playCount = await Progress.countDocuments({ contentId: item._id });
        const likeCount = await Favorite.countDocuments({ contentId: item._id });
        const completionCount = await Progress.countDocuments({ 
          contentId: item._id, 
          completed: true 
        });
        
        const completionRate = playCount > 0 ? (completionCount / playCount * 100).toFixed(1) : 0;

        return {
          ...item,
          analytics: {
            playCount,
            likeCount,
            completionCount,
            completionRate: parseFloat(completionRate)
          }
        };
      }));

      const response = {
        content: enrichedContent,
        pagination: {
          currentPage: page,
          totalPages,
          totalContent,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      };

      res.success(response, 'Content retrieved successfully');

    } catch (error) {
      logger.error('Admin get content error:', error);
      res.status(500).error(['Failed to retrieve content'], 'Internal server error');
    }
  }
);

// GET /admin/content/stats - Get content statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_CONTENT_STATS'),
  async (req, res) => {
    try {
      const totalContent = await Content.countDocuments();
      const activeContent = await Content.countDocuments({ isActive: true });
      const featuredContent = await Content.countDocuments({ featured: true });

      // Content by type
      const contentByType = await Content.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]);

      // Content by language
      const contentByLanguage = await Content.aggregate([
        { $unwind: '$availableLanguages' },
        { $group: { _id: '$availableLanguages', count: { $sum: 1 } } }
      ]);

      // Content by age range
      const contentByAgeRange = await Content.aggregate([
        { $group: { _id: '$ageRange', count: { $sum: 1 } } }
      ]);

      // Most popular content (by play count)
      const popularContent = await Progress.aggregate([
        { $group: { _id: '$contentId', playCount: { $sum: 1 } } },
        { $sort: { playCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'contents',
            localField: '_id',
            foreignField: '_id',
            as: 'content'
          }
        },
        { $unwind: '$content' },
        {
          $project: {
            title: '$content.content.en.title',
            playCount: 1
          }
        }
      ]);

      // Total engagement metrics
      const totalPlays = await Progress.countDocuments();
      const totalLikes = await Favorite.countDocuments();
      const totalCompletions = await Progress.countDocuments({ completed: true });
      
      const avgCompletionRate = totalPlays > 0 ? (totalCompletions / totalPlays * 100).toFixed(1) : 0;

      const stats = {
        totalContent,
        activeContent,
        inactiveContent: totalContent - activeContent,
        featuredContent,
        contentByType: contentByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        contentByLanguage: contentByLanguage.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        contentByAgeRange: contentByAgeRange.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        engagement: {
          totalPlays,
          totalLikes,
          totalCompletions,
          avgCompletionRate: parseFloat(avgCompletionRate)
        },
        popularContent
      };

      res.success(stats, 'Content statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin get content stats error:', error);
      res.status(500).error(['Failed to retrieve content statistics'], 'Internal server error');
    }
  }
);

// GET /admin/content/:id - Get specific content details
router.get('/:id',
  adminAuth,
  logAdminAction('GET_CONTENT_DETAILS'),
  [param('id').isMongoId().withMessage('Invalid content ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const content = await Content.findById(id).lean();

      if (!content) {
        return res.status(404).error(['Content not found'], 'Content not found');
      }

      // Get detailed analytics
      const playCount = await Progress.countDocuments({ contentId: id });
      const likeCount = await Favorite.countDocuments({ contentId: id });
      const completionCount = await Progress.countDocuments({ 
        contentId: id, 
        completed: true 
      });

      // Get recent activity
      const recentProgress = await Progress.find({ contentId: id })
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .limit(10)
        .lean();

      const recentFavorites = await Favorite.find({ contentId: id })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const completionRate = playCount > 0 ? (completionCount / playCount * 100).toFixed(1) : 0;

      const contentDetails = {
        ...content,
        analytics: {
          playCount,
          likeCount,
          completionCount,
          completionRate: parseFloat(completionRate)
        },
        recentActivity: {
          recentProgress: recentProgress.map(p => ({
            user: p.userId,
            progress: p.progress,
            total: p.total,
            completed: p.completed,
            timestamp: p.updatedAt
          })),
          recentFavorites: recentFavorites.map(f => ({
            user: f.userId,
            timestamp: f.createdAt
          }))
        }
      };

      res.success(contentDetails, 'Content details retrieved successfully');

    } catch (error) {
      logger.error('Admin get content details error:', error);
      res.status(500).error(['Failed to retrieve content details'], 'Internal server error');
    }
  }
);

// POST /admin/content - Create new content
router.post('/',
  adminAuth,
  logAdminAction('CREATE_CONTENT'),
  validateAdminRequest(validateContentCreation),
  async (req, res) => {
    try {
      const contentData = req.body;
      
      // Create content structure based on language
      const content = new Content({
        type: contentData.type,
        title: contentData.title,
        description: contentData.description,
        durationSec: contentData.durationSec,
        ageRange: contentData.ageRange,
        featured: contentData.featured || false,
        isNewCollection: contentData.isNewCollection || false,
        isTrendingNow: contentData.isTrendingNow || false,
        defaultLanguage: contentData.language,
        availableLanguages: [contentData.language],
        languages: {
          [contentData.language]: {
            title: contentData.title,
            description: contentData.description,
            audioUrl: contentData.audioUrl,
            imageUrl: contentData.imageUrl,
            thumbnailUrl: contentData.thumbnailUrl || contentData.imageUrl
          }
        },
        metadata: {
          keyValue: contentData.keyValue || contentData.title.toLowerCase().replace(/\s+/g, '-'),
          summary: contentData.summary || contentData.description
        }
      });

      await content.save();

      logger.info(`New content created: ${contentData.title} by admin ${req.userId}`);

      res.status(201).success(content, 'Content created successfully');

    } catch (error) {
      logger.error('Admin create content error:', error);
      res.status(500).error(['Failed to create content'], 'Internal server error');
    }
  }
);

// PATCH /admin/content/:id - Update content
router.patch('/:id',
  adminAuth,
  logAdminAction('UPDATE_CONTENT'),
  [param('id').isMongoId().withMessage('Invalid content ID')],
  validateAdminRequest(validateContentUpdate),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle language-specific updates
      const content = await Content.findById(id);
      if (!content) {
        return res.status(404).error(['Content not found'], 'Content not found');
      }

      // Update main fields
      if (updateData.type) content.type = updateData.type;
      if (updateData.ageRange) content.ageRange = updateData.ageRange;
      if (typeof updateData.featured === 'boolean') content.featured = updateData.featured;
      if (typeof updateData.isNewCollection === 'boolean') content.isNewCollection = updateData.isNewCollection;
      if (typeof updateData.isTrendingNow === 'boolean') content.isTrendingNow = updateData.isTrendingNow;
      if (typeof updateData.isActive === 'boolean') content.isActive = updateData.isActive;

      // Update language-specific content
      if (updateData.language && updateData.title) {
        if (!content.content[updateData.language]) {
          content.content[updateData.language] = {};
          content.availableLanguages.push(updateData.language);
        }
        
        if (updateData.title) content.content[updateData.language].title = updateData.title;
        if (updateData.description) content.content[updateData.language].description = updateData.description;
        if (updateData.audioUrl) content.content[updateData.language].audioUrl = updateData.audioUrl;
        if (updateData.imageUrl) content.content[updateData.language].imageUrl = updateData.imageUrl;
        if (updateData.duration) content.content[updateData.language].duration = updateData.duration;
      }

      await content.save();

      res.success(content, 'Content updated successfully');

    } catch (error) {
      logger.error('Admin update content error:', error);
      res.status(500).error(['Failed to update content'], 'Internal server error');
    }
  }
);

// DELETE /admin/content/:id - Delete content (soft delete)
router.delete('/:id',
  adminAuth,
  logAdminAction('DELETE_CONTENT'),
  [param('id').isMongoId().withMessage('Invalid content ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const content = await Content.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!content) {
        return res.status(404).error(['Content not found'], 'Content not found');
      }

      res.success({ deleted: true, content }, 'Content deleted successfully');

    } catch (error) {
      logger.error('Admin delete content error:', error);
      res.status(500).error(['Failed to delete content'], 'Internal server error');
    }
  }
);

// PATCH /admin/content/:id/featured - Toggle featured status
router.patch('/:id/featured',
  adminAuth,
  logAdminAction('TOGGLE_FEATURED'),
  [
    param('id').isMongoId().withMessage('Invalid content ID'),
    body('featured').isBoolean().withMessage('Featured must be a boolean')
  ],
  async (req, res) => {
    try {
      const { id } = req.params;
      const { featured } = req.body;

      const content = await Content.findByIdAndUpdate(
        id,
        { featured },
        { new: true }
      );

      if (!content) {
        return res.status(404).error(['Content not found'], 'Content not found');
      }

      res.success(content, `Content ${featured ? 'featured' : 'unfeatured'} successfully`);

    } catch (error) {
      logger.error('Admin toggle featured error:', error);
      res.status(500).error(['Failed to update featured status'], 'Internal server error');
    }
  }
);

module.exports = router;
