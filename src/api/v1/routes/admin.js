const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { adminController } = require('../controllers');
const { 
  authGuard, 
  adminGuard, 
  adminRateLimit,
  writeSlowDown 
} = require('../middlewares');
const {
  validate,
  createContentSchema,
  updateContentSchema,
  contentIdSchema,
  uploadFileSchema,
  adminUserListSchema,
  updateUserSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryListSchema,
  categoryContentSchema
} = require('../validators');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authGuard);
router.use(adminGuard);
router.use(adminRateLimit);

// Helper function to ensure directory exists
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Configure multer for file uploads with category-based organization
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      const { categorySlug = 'uncategorized', type = 'general' } = req.body;

      // Determine file type directory
      let fileTypeDir = 'general';
      if (file.mimetype.startsWith('audio/')) {
        fileTypeDir = 'audio';
      } else if (file.mimetype.startsWith('video/')) {
        fileTypeDir = 'videos';
      } else if (file.mimetype.startsWith('image/')) {
        fileTypeDir = file.fieldname === 'thumbnail' ? 'thumbnails' : 'images';
      }

      const uploadPath = path.join(process.cwd(), 'uploads', fileTypeDir, categorySlug);
      await ensureDirectoryExists(uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${file.fieldname}-${uniqueSuffix}-${sanitizedOriginalName}`);
  }
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = {
    // Audio formats
    'audio/mpeg': true,      // MP3
    'audio/wav': true,       // WAV
    'audio/x-wav': true,     // WAV (alternative)
    'audio/aac': true,       // AAC
    'audio/mp4': true,       // M4A
    'audio/x-m4a': true,     // M4A (alternative)

    // Video formats
    'video/mp4': true,       // MP4
    'video/webm': true,      // WebM
    'video/x-msvideo': true, // AVI
    'video/quicktime': true, // MOV

    // Image formats (for thumbnails and images)
    'image/jpeg': true,      // JPG/JPEG
    'image/png': true,       // PNG
    'image/webp': true,      // WebP
  };

  if (allowedMimeTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed. Supported formats: MP3, WAV, AAC, M4A, MP4, WebM, AVI, MOV, JPG, PNG, WebP`));
  }
};

// Different upload configurations for different file types
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB limit for videos
  },
  fileFilter: fileFilter
});

// Specific upload configurations
const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for audio
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      fileFilter(req, file, cb);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit for videos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      fileFilter(req, file, cb);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for images
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      fileFilter(req, file, cb);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Multi-file upload for content creation (audio + video + thumbnail + image)
const uploadContent = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]);

// Content Management Routes
router.get('/content',
  validate(adminUserListSchema),
  adminController.getContentList
);

router.post('/content',
  writeSlowDown,
  validate(createContentSchema),
  adminController.createContent
);

router.get('/content/:id',
  validate(contentIdSchema),
  adminController.getContentById
);

router.put('/content/:id',
  writeSlowDown,
  validate(updateContentSchema),
  adminController.updateContent
);

router.delete('/content/:id',
  validate(contentIdSchema),
  adminController.deleteContent
);

router.post('/content/bulk-update',
  writeSlowDown,
  adminController.bulkUpdateContent
);

// User Management Routes
router.get('/users',
  validate(adminUserListSchema),
  adminController.getUserList
);

router.get('/users/:id',
  validate(contentIdSchema), // Reuse for user ID validation
  adminController.getUserById
);

router.put('/users/:id',
  writeSlowDown,
  validate(updateUserSchema),
  adminController.updateUser
);

router.delete('/users/:id',
  validate(contentIdSchema), // Reuse for user ID validation
  adminController.deleteUser
);

// File Upload Routes
router.post('/upload',
  upload.single('file'),
  adminController.uploadFile
);

// Specific file type uploads
router.post('/upload/audio',
  uploadAudio.single('audio'),
  adminController.uploadFile
);

router.post('/upload/video',
  uploadVideo.single('video'),
  adminController.uploadFile
);

router.post('/upload/image',
  uploadImage.single('image'),
  adminController.uploadFile
);

router.post('/upload/thumbnail',
  uploadImage.single('thumbnail'),
  adminController.uploadFile
);

// Multi-file upload for content
router.post('/upload/content',
  uploadContent,
  adminController.uploadContentFiles
);

// Analytics and Stats Routes
router.get('/stats/overview',
  adminController.getOverviewStats
);

router.get('/stats/content',
  adminController.getContentStats
);

router.get('/stats/users',
  adminController.getUserStats
);

router.get('/stats/engagement',
  adminController.getEngagementStats
);

// System Management Routes
router.get('/system/health',
  adminController.getSystemHealth
);

router.post('/system/cache/clear',
  writeSlowDown,
  adminController.clearCache
);

// Category Management Routes
router.get('/categories',
  validate(categoryListSchema),
  adminController.getCategoryList
);

router.post('/categories',
  writeSlowDown,
  validate(createCategorySchema),
  adminController.createCategory
);

router.get('/categories/:id',
  validate(categoryIdSchema),
  adminController.getCategoryById
);

router.put('/categories/:id',
  writeSlowDown,
  validate(updateCategorySchema),
  adminController.updateCategory
);

router.delete('/categories/:id',
  validate(categoryIdSchema),
  adminController.deleteCategory
);

router.get('/categories/:id/content',
  validate(categoryContentSchema),
  adminController.getCategoryContent
);

// Category Statistics Routes
router.get('/stats/categories',
  adminController.getCategoryStats
);

router.post('/categories/update-counts',
  writeSlowDown,
  adminController.updateCategoryContentCounts
);

module.exports = router;
