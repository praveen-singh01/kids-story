const express = require('express');
const multer = require('multer');
const path = require('path');
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
  updateUserSchema
} = require('../validators');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authGuard);
router.use(adminGuard);
router.use(adminRateLimit);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), 'uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow audio and image files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and image files are allowed'));
    }
  }
});

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

module.exports = router;
