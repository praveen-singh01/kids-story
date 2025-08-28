const path = require('path');
const fs = require('fs').promises;
const { adminService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class AdminController {
  /**
   * Get content list with admin-specific details
   */
  async getContentList(req, res, next) {
    try {
      const filters = {
        type: req.query.type,
        ageRange: req.query.ageRange,
        isActive: req.query.isActive,
        isFeatured: req.query.isFeatured,
      };
      
      const options = {
        limit: req.query.limit || 20,
        offset: req.query.offset || 0,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc',
        search: req.query.q,
      };

      const result = await adminService.getContentList(filters, options);
      
      res.json(success(result, 'Content list retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new content
   */
  async createContent(req, res, next) {
    try {
      const contentData = req.body;
      
      const content = await adminService.createContent(contentData);
      
      res.status(201).json(success(content, 'Content created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content by ID with admin details
   */
  async getContentById(req, res, next) {
    try {
      const { id } = req.params;
      
      const content = await adminService.getContentById(id);
      
      res.json(success(content, 'Content retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update content
   */
  async updateContent(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const content = await adminService.updateContent(id, updateData);
      
      res.json(success(content, 'Content updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(req, res, next) {
    try {
      const { id } = req.params;
      
      await adminService.deleteContent(id);
      
      res.json(success(null, 'Content deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk update content
   */
  async bulkUpdateContent(req, res, next) {
    try {
      const { ids, updates } = req.body;
      
      const result = await adminService.bulkUpdateContent(ids, updates);
      
      res.json(success(result, 'Content updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user list with admin details
   */
  async getUserList(req, res, next) {
    try {
      const filters = {
        plan: req.query.plan,
        status: req.query.status,
        provider: req.query.provider,
      };
      
      const options = {
        limit: req.query.limit || 20,
        offset: req.query.offset || 0,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc',
        search: req.query.q,
      };

      const result = await adminService.getUserList(filters, options);
      
      res.json(success(result, 'User list retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user by ID with admin details
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await adminService.getUserById(id);
      
      res.json(success(user, 'User retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await adminService.updateUser(id, updateData);
      
      res.json(success(user, 'User updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      
      await adminService.deleteUser(id);
      
      res.json(success(null, 'User deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload file
   */
  async uploadFile(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json(error(['NO_FILE'], 'No file uploaded'));
      }

      const file = req.file;
      const relativePath = path.relative(process.cwd(), file.path);
      const fileUrl = `/${relativePath.replace(/\\/g, '/')}`;

      // Extract file metadata
      const metadata = {
        format: path.extname(file.originalname).toLowerCase().substring(1),
        size: file.size,
        mimetype: file.mimetype,
      };

      // Add duration for audio/video files (would need ffprobe in production)
      if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
        // TODO: Implement duration extraction using ffprobe
        metadata.duration = null;
      }

      // Add dimensions for images (would need sharp or similar in production)
      if (file.mimetype.startsWith('image/')) {
        // TODO: Implement image dimension extraction
        metadata.dimensions = null;
      }

      const result = {
        url: fileUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        metadata,
        path: relativePath,
      };

      res.json(success(result, 'File uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload multiple content files (audio, video, thumbnail, image)
   */
  async uploadContentFiles(req, res, next) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json(error(['NO_FILES'], 'No files uploaded'));
      }

      const uploadedFiles = {};
      const baseUrl = req.protocol + '://' + req.get('host');

      // Process each file type
      for (const [fieldName, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          const file = files[0]; // Take first file for each type
          const relativePath = path.relative(process.cwd(), file.path);
          const fileUrl = `/${relativePath.replace(/\\/g, '/')}`;

          uploadedFiles[fieldName] = {
            url: fileUrl,
            fullUrl: baseUrl + fileUrl,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            path: relativePath,
          };
        }
      }

      res.json(success(uploadedFiles, 'Content files uploaded successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats(req, res, next) {
    try {
      const stats = await adminService.getOverviewStats();
      
      res.json(success(stats, 'Overview statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content statistics
   */
  async getContentStats(req, res, next) {
    try {
      const stats = await adminService.getContentStats();
      
      res.json(success(stats, 'Content statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(req, res, next) {
    try {
      const stats = await adminService.getUserStats();
      
      res.json(success(stats, 'User statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get engagement statistics
   */
  async getEngagementStats(req, res, next) {
    try {
      const stats = await adminService.getEngagementStats();
      
      res.json(success(stats, 'Engagement statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(req, res, next) {
    try {
      const health = await adminService.getSystemHealth();
      
      res.json(success(health, 'System health retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Clear cache
   */
  async clearCache(req, res, next) {
    try {
      await adminService.clearCache();

      res.json(success(null, 'Cache cleared successfully'));
    } catch (err) {
      next(err);
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Get category list
   */
  async getCategoryList(req, res, next) {
    try {
      const filters = {
        isActive: req.query.isActive,
      };

      const options = {
        limit: req.query.limit || 20,
        offset: req.query.offset || 0,
        sort: req.query.sort || 'sortOrder',
        order: req.query.order || 'asc',
        search: req.query.q,
      };

      const result = await adminService.getCategoryList(filters, options);

      res.json(success(result, 'Category list retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new category
   */
  async createCategory(req, res, next) {
    try {
      const categoryData = req.body;

      const category = await adminService.createCategory(categoryData);

      res.status(201).json(success(category, 'Category created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req, res, next) {
    try {
      const { id } = req.params;

      const category = await adminService.getCategoryById(id);

      res.json(success(category, 'Category retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update category
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const category = await adminService.updateCategory(id, updateData);

      res.json(success(category, 'Category updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      const category = await adminService.deleteCategory(id);

      res.json(success(category, 'Category deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content in a specific category
   */
  async getCategoryContent(req, res, next) {
    try {
      const { id } = req.params;

      const options = {
        limit: req.query.limit || 20,
        offset: req.query.offset || 0,
        sort: req.query.sort || 'createdAt',
        order: req.query.order || 'desc',
      };

      const result = await adminService.getCategoryContent(id, options);

      res.json(success(result, 'Category content retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(req, res, next) {
    try {
      const stats = await adminService.getCategoryStats();

      res.json(success(stats, 'Category statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update category content counts
   */
  async updateCategoryContentCounts(req, res, next) {
    try {
      const categories = await adminService.updateCategoryContentCounts();

      res.json(success({ updated: categories.length }, 'Category content counts updated successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
