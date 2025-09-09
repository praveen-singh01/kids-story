const express = require('express');
const { body, param, query } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { Category, Content } = require('../../models');
const { adminAuth, logAdminAction, validateAdminRequest } = require('../../middleware/adminAuth');
const logger = require('../../config/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads/categories');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `category_${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Validation rules
const validateCategoryCreation = [
  body('name').notEmpty().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('imageUrl').notEmpty().isURL(),
  body('parentId').optional().isMongoId(),
  body('sortOrder').optional().isInt({ min: 0 })
];

const validateCategoryUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('imageUrl').optional().isURL(),
  body('parentId').optional().isMongoId(),
  body('sortOrder').optional().isInt({ min: 0 }),
  body('isActive').optional().isBoolean()
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim(),
  query('parentId').optional().isMongoId(),
  query('isActive').optional().isBoolean().toBoolean()
];

// POST /admin/categories/upload - Upload category thumbnail
router.post('/upload',
  adminAuth,
  logAdminAction('UPLOAD_CATEGORY_IMAGE'),
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).error(['No image uploaded'], 'Image upload failed');
      }

      const imageUrl = `/uploads/categories/${req.file.filename}`;
      
      logger.info(`Category image uploaded: ${req.file.filename} (${req.file.size} bytes)`);

      res.success({
        imageUrl,
        filename: req.file.filename,
        size: req.file.size
      }, 'Category image uploaded successfully');

    } catch (error) {
      logger.error('Category image upload error:', error);
      res.status(500).error(['Failed to upload image'], 'Internal server error');
    }
  }
);

// GET /admin/categories - List all categories with admin metadata
router.get('/',
  adminAuth,
  logAdminAction('LIST_CATEGORIES'),
  validateAdminRequest(validatePagination),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        parentId,
        isActive
      } = req.query;

      // Build filter query
      const filter = {};
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (parentId !== undefined) {
        filter.parentId = parentId === 'null' ? null : parentId;
      }
      
      if (typeof isActive === 'boolean') {
        filter.isActive = isActive;
      }

      const skip = (page - 1) * limit;

      // Get categories with content count
      const categories = await Category.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'contents',
            localField: '_id',
            foreignField: 'category',
            as: 'content'
          }
        },
        {
          $addFields: {
            contentCount: { $size: '$content' }
          }
        },
        {
          $project: {
            content: 0 // Remove the content array, keep only count
          }
        },
        { $sort: { sortOrder: 1, name: 1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      const total = await Category.countDocuments(filter);

      res.success({
        categories,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
          hasMore: skip + categories.length < total
        }
      }, 'Categories retrieved successfully');

    } catch (error) {
      logger.error('Admin list categories error:', error);
      res.status(500).error(['Failed to retrieve categories'], 'Internal server error');
    }
  }
);

// GET /admin/categories/stats - Get category statistics
router.get('/stats',
  adminAuth,
  logAdminAction('GET_CATEGORY_STATS'),
  async (req, res) => {
    try {
      const totalCategories = await Category.countDocuments();
      const activeCategories = await Category.countDocuments({ isActive: true });
      const topLevelCategories = await Category.countDocuments({ parentId: null, isActive: true });

      // Categories with content count
      const categoriesWithContent = await Category.aggregate([
        {
          $lookup: {
            from: 'contents',
            localField: '_id',
            foreignField: 'category',
            as: 'content'
          }
        },
        {
          $addFields: {
            contentCount: { $size: '$content' }
          }
        },
        {
          $match: {
            contentCount: { $gt: 0 }
          }
        },
        {
          $sort: { contentCount: -1 }
        },
        {
          $limit: 5
        },
        {
          $project: {
            name: 1,
            contentCount: 1
          }
        }
      ]);

      res.success({
        totalCategories,
        activeCategories,
        topLevelCategories,
        categoriesWithContent
      }, 'Category statistics retrieved successfully');

    } catch (error) {
      logger.error('Admin category stats error:', error);
      res.status(500).error(['Failed to retrieve category statistics'], 'Internal server error');
    }
  }
);

// POST /admin/categories - Create new category
router.post('/',
  adminAuth,
  logAdminAction('CREATE_CATEGORY'),
  validateAdminRequest(validateCategoryCreation),
  async (req, res) => {
    try {
      const categoryData = req.body;

      // Validate parent category if provided
      if (categoryData.parentId) {
        const parentCategory = await Category.findById(categoryData.parentId);
        if (!parentCategory) {
          return res.status(400).error(['Parent category not found'], 'Invalid parent category');
        }
      }

      const category = new Category(categoryData);
      await category.save();

      logger.info(`New category created: ${categoryData.name} by admin ${req.userId}`);

      res.status(201).success(category, 'Category created successfully');

    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).error(['Category with this name already exists'], 'Duplicate category name');
      }
      logger.error('Admin create category error:', error);
      res.status(500).error(['Failed to create category'], 'Internal server error');
    }
  }
);

// GET /admin/categories/:id - Get category by ID
router.get('/:id',
  adminAuth,
  logAdminAction('GET_CATEGORY'),
  [param('id').isMongoId().withMessage('Invalid category ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findById(id)
        .populate('subcategories')
        .lean();

      if (!category) {
        return res.status(404).error(['Category not found'], 'Category not found');
      }

      // Get content count for this category
      const contentCount = await Content.countDocuments({ category: id });
      category.contentCount = contentCount;

      res.success(category, 'Category retrieved successfully');

    } catch (error) {
      logger.error('Admin get category error:', error);
      res.status(500).error(['Failed to retrieve category'], 'Internal server error');
    }
  }
);

// PATCH /admin/categories/:id - Update category
router.patch('/:id',
  adminAuth,
  logAdminAction('UPDATE_CATEGORY'),
  [param('id').isMongoId().withMessage('Invalid category ID')],
  validateAdminRequest(validateCategoryUpdate),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate parent category if provided
      if (updateData.parentId) {
        const parentCategory = await Category.findById(updateData.parentId);
        if (!parentCategory) {
          return res.status(400).error(['Parent category not found'], 'Invalid parent category');
        }

        // Prevent circular references
        if (updateData.parentId === id) {
          return res.status(400).error(['Category cannot be its own parent'], 'Invalid parent category');
        }
      }

      const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!category) {
        return res.status(404).error(['Category not found'], 'Category not found');
      }

      res.success(category, 'Category updated successfully');

    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).error(['Category with this name already exists'], 'Duplicate category name');
      }
      logger.error('Admin update category error:', error);
      res.status(500).error(['Failed to update category'], 'Internal server error');
    }
  }
);

// DELETE /admin/categories/:id - Delete category (soft delete)
router.delete('/:id',
  adminAuth,
  logAdminAction('DELETE_CATEGORY'),
  [param('id').isMongoId().withMessage('Invalid category ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if category has content
      const contentCount = await Content.countDocuments({ category: id });
      if (contentCount > 0) {
        return res.status(400).error(
          [`Cannot delete category with ${contentCount} content items`],
          'Category has associated content'
        );
      }

      // Check if category has subcategories
      const subcategoryCount = await Category.countDocuments({ parentId: id });
      if (subcategoryCount > 0) {
        return res.status(400).error(
          [`Cannot delete category with ${subcategoryCount} subcategories`],
          'Category has subcategories'
        );
      }

      const category = await Category.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!category) {
        return res.status(404).error(['Category not found'], 'Category not found');
      }

      res.success({ deleted: true, category }, 'Category deleted successfully');

    } catch (error) {
      logger.error('Admin delete category error:', error);
      res.status(500).error(['Failed to delete category'], 'Internal server error');
    }
  }
);

// PATCH /admin/categories/:id/toggle-active - Toggle category active status
router.patch('/:id/toggle-active',
  adminAuth,
  logAdminAction('TOGGLE_CATEGORY_ACTIVE'),
  [param('id').isMongoId().withMessage('Invalid category ID')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).error(['Category not found'], 'Category not found');
      }

      category.isActive = !category.isActive;
      await category.save();

      res.success(category, `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`);

    } catch (error) {
      logger.error('Admin toggle category active error:', error);
      res.status(500).error(['Failed to toggle category status'], 'Internal server error');
    }
  }
);

module.exports = router;
