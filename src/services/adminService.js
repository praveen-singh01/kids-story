const contentRepository = require('../repositories/contentRepository');
const userRepository = require('../repositories/userRepository');
const kidRepository = require('../repositories/kidRepository');
const favoriteRepository = require('../repositories/favoriteRepository');
const categoryRepository = require('../repositories/categoryRepository');
const { Content, User, KidProfile, Category } = require('../models');
// TODO: Redis temporarily disabled
// const { cache } = require('../loaders/redisLoader');
const config = require('../config');
const logger = require('../utils/logger');

class AdminService {
  /**
   * Get content list with admin-specific details
   */
  async getContentList(filters = {}, options = {}) {
    const { limit = 20, offset = 0, sort = 'createdAt', order = 'desc', search } = options;
    
    // Build query
    const query = { ...filters };
    
    // Remove empty filters
    Object.keys(query).forEach(key => {
      if (query[key] === '' || query[key] === undefined) {
        delete query[key];
      }
    });
    
    // Add search if provided
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const content = await Content.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(offset)
      .limit(limit)
      .lean();
    
    const total = await Content.countDocuments(query);
    
    return {
      content,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + content.length < total,
      },
    };
  }

  /**
   * Create new content
   */
  async createContent(contentData) {
    // Validate category exists
    if (contentData.categoryId) {
      const category = await categoryRepository.findById(contentData.categoryId);
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 400;
        throw error;
      }
    }

    // Generate slug from title if not provided
    if (!contentData.slug) {
      contentData.slug = this.generateSlug(contentData.title);
    }

    // Ensure slug is unique
    const existingContent = await Content.findOne({ slug: contentData.slug });
    if (existingContent) {
      contentData.slug = `${contentData.slug}-${Date.now()}`;
    }

    const content = new Content(contentData);
    await content.save();

    // Update category content count
    if (contentData.categoryId) {
      await categoryRepository.updateById(contentData.categoryId, {
        $inc: { contentCount: 1 }
      });
    }

    // Clear relevant caches
    await this.clearContentCaches();

    logger.info({
      contentId: content._id,
      title: content.title,
      categoryId: contentData.categoryId
    }, 'Content created by admin');

    return content;
  }

  /**
   * Get content by ID with admin details
   */
  async getContentById(id) {
    const content = await Content.findById(id).lean();
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Get additional stats
    const stats = await this.getContentEngagementStats(id);
    
    return {
      ...content,
      stats,
    };
  }

  /**
   * Update content
   */
  async updateContent(id, updateData) {
    const content = await Content.findById(id);
    if (!content) {
      const error = new Error('Content not found');
      error.statusCode = 404;
      throw error;
    }

    const oldCategoryId = content.categoryId;

    // Validate new category if being changed
    if (updateData.categoryId && updateData.categoryId !== oldCategoryId?.toString()) {
      const category = await categoryRepository.findById(updateData.categoryId);
      if (!category) {
        const error = new Error('Category not found');
        error.statusCode = 400;
        throw error;
      }
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== content.title) {
      updateData.slug = this.generateSlug(updateData.title);

      // Ensure slug is unique
      const existingContent = await Content.findOne({
        slug: updateData.slug,
        _id: { $ne: id }
      });
      if (existingContent) {
        updateData.slug = `${updateData.slug}-${Date.now()}`;
      }
    }

    Object.assign(content, updateData);
    await content.save();

    // Update category content counts if category changed
    if (updateData.categoryId && updateData.categoryId !== oldCategoryId?.toString()) {
      // Decrement old category count
      if (oldCategoryId) {
        await categoryRepository.updateById(oldCategoryId, {
          $inc: { contentCount: -1 }
        });
      }

      // Increment new category count
      await categoryRepository.updateById(updateData.categoryId, {
        $inc: { contentCount: 1 }
      });
    }

    // Clear relevant caches
    await this.clearContentCaches();

    logger.info({
      contentId: id,
      updates: Object.keys(updateData),
      categoryChanged: updateData.categoryId !== oldCategoryId?.toString()
    }, 'Content updated by admin');

    return content;
  }

  /**
   * Delete content
   */
  async deleteContent(id) {
    const content = await Content.findById(id);
    if (!content) {
      const error = new Error('Content not found');
      error.statusCode = 404;
      throw error;
    }

    const categoryId = content.categoryId;

    // Remove from favorites
    await favoriteRepository.removeContentFromAllFavorites(id);

    // Delete the content
    await Content.findByIdAndDelete(id);

    // Update category content count
    if (categoryId) {
      await categoryRepository.updateById(categoryId, {
        $inc: { contentCount: -1 }
      });
    }

    // Clear relevant caches
    await this.clearContentCaches();

    logger.info({
      contentId: id,
      title: content.title,
      categoryId: categoryId
    }, 'Content deleted by admin');

    return true;
  }

  /**
   * Bulk update content
   */
  async bulkUpdateContent(ids, updates) {
    const result = await Content.updateMany(
      { _id: { $in: ids } },
      { $set: updates }
    );
    
    // Clear relevant caches
    await this.clearContentCaches();
    
    logger.info({ 
      contentIds: ids, 
      updates: Object.keys(updates),
      modifiedCount: result.modifiedCount 
    }, 'Bulk content update by admin');
    
    return {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
    };
  }

  /**
   * Get user list with admin details
   */
  async getUserList(filters = {}, options = {}) {
    const { limit = 20, offset = 0, sort = 'createdAt', order = 'desc', search } = options;
    
    // Build query
    const query = {};
    
    if (filters.plan) {
      query['subscription.plan'] = filters.plan;
    }
    
    if (filters.status) {
      query['subscription.status'] = filters.status;
    }
    
    if (filters.provider) {
      query.provider = filters.provider;
    }
    
    // Add search if provided
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(offset)
      .limit(limit)
      .lean();
    
    // Get kid counts for each user
    const usersWithKids = await Promise.all(
      users.map(async (user) => {
        const kidsCount = await KidProfile.countDocuments({ userId: user._id });
        return {
          ...user,
          kidsCount,
        };
      })
    );
    
    const total = await User.countDocuments(query);
    
    return {
      users: usersWithKids,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + users.length < total,
      },
    };
  }

  /**
   * Get user by ID with admin details
   */
  async getUserById(id) {
    const user = await User.findById(id).lean();
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get user's kids
    const kids = await KidProfile.find({ userId: id }).lean();
    
    // Get user's favorites count
    const favoritesCount = await favoriteRepository.getUserFavoritesCount(id);
    
    return {
      ...user,
      kids,
      favoritesCount,
    };
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    Object.assign(user, updateData);
    await user.save();
    
    // TODO: Redis temporarily disabled
    // Clear user cache
    // await cache.del(`user:${id}`);
    
    logger.info({ userId: id, updates: Object.keys(updateData) }, 'User updated by admin');
    
    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Delete user's kids
    await KidProfile.deleteMany({ userId: id });
    
    // Delete user's favorites
    await favoriteRepository.deleteUserFavorites(id);
    
    // Delete the user
    await User.findByIdAndDelete(id);
    
    // TODO: Redis temporarily disabled
    // Clear user cache
    // await cache.del(`user:${id}`);
    
    logger.info({ userId: id, email: user.email }, 'User deleted by admin');
    
    return true;
  }

  /**
   * Get overview statistics
   */
  async getOverviewStats() {
    const [
      totalContent,
      totalUsers,
      totalKids,
      activeUsers,
      contentByType,
      usersByPlan,
      recentContent,
      recentUsers
    ] = await Promise.all([
      Content.countDocuments({ isActive: true }),
      User.countDocuments(),
      KidProfile.countDocuments(),
      User.countDocuments({ 
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      Content.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
      ]),
      Content.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title type createdAt')
        .lean(),
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('email name createdAt')
        .lean()
    ]);
    
    return {
      totalContent,
      totalUsers,
      totalKids,
      activeUsers,
      contentByType: contentByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByPlan: usersByPlan.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentContent,
      recentUsers,
    };
  }

  /**
   * Generate slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Clear content-related caches
   */
  async clearContentCaches() {
    const cacheKeys = [
      'content:*',
      'explore:*',
      'home:*',
      'categories'
    ];
    
    // TODO: Redis temporarily disabled
    // for (const pattern of cacheKeys) {
    //   const keys = await cache.keys(pattern);
    //   if (keys.length > 0) {
    //     await cache.del(...keys);
    //   }
    // }
  }

  /**
   * Get content engagement stats
   */
  async getContentEngagementStats(contentId) {
    // This would typically come from analytics data
    // For now, return mock data
    return {
      totalPlays: Math.floor(Math.random() * 1000),
      uniqueUsers: Math.floor(Math.random() * 500),
      avgCompletionRate: Math.random() * 100,
      lastPlayedAt: new Date(),
    };
  }

  /**
   * Get content statistics
   */
  async getContentStats() {
    const [
      totalContent,
      activeContent,
      contentByType,
      contentByAgeRange,
      contentByLanguage,
      recentContent,
      popularContent
    ] = await Promise.all([
      Content.countDocuments(),
      Content.countDocuments({ isActive: true }),
      Content.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Content.aggregate([
        { $group: { _id: '$ageRange', count: { $sum: 1 } } }
      ]),
      Content.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } }
      ]),
      Content.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title type createdAt popularityScore')
        .lean(),
      Content.find({ isActive: true })
        .sort({ popularityScore: -1 })
        .limit(10)
        .select('title type popularityScore')
        .lean()
    ]);

    return {
      totalContent,
      activeContent,
      inactiveContent: totalContent - activeContent,
      contentByType: contentByType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      contentByAgeRange: contentByAgeRange.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      contentByLanguage: contentByLanguage.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentContent,
      popularContent,
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    const [
      totalUsers,
      activeUsers,
      usersByPlan,
      usersByProvider,
      usersByStatus,
      recentUsers,
      topUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      User.aggregate([
        { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$provider', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $group: { _id: '$subscription.status', count: { $sum: 1 } } }
      ]),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('email name createdAt lastLoginAt')
        .lean(),
      User.find()
        .sort({ lastLoginAt: -1 })
        .limit(10)
        .select('email name lastLoginAt')
        .lean()
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByPlan: usersByPlan.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByProvider: usersByProvider.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      usersByStatus: usersByStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentUsers,
      topUsers,
    };
  }

  /**
   * Get engagement statistics
   */
  async getEngagementStats() {
    // This would typically come from analytics/tracking data
    // For now, return mock data based on content and users
    const [totalContent, totalUsers] = await Promise.all([
      Content.countDocuments({ isActive: true }),
      User.countDocuments()
    ]);

    // Generate realistic mock data
    const totalPlays = Math.floor(totalContent * totalUsers * 0.3);
    const uniqueListeners = Math.floor(totalUsers * 0.7);
    const avgSessionDuration = Math.floor(Math.random() * 300) + 180; // 3-8 minutes
    const completionRate = Math.floor(Math.random() * 30) + 60; // 60-90%

    return {
      totalPlays,
      uniqueListeners,
      avgSessionDuration,
      completionRate,
      dailyActiveUsers: Math.floor(uniqueListeners * 0.2),
      weeklyActiveUsers: Math.floor(uniqueListeners * 0.5),
      monthlyActiveUsers: uniqueListeners,
      topContent: await Content.find({ isActive: true })
        .sort({ popularityScore: -1 })
        .limit(5)
        .select('title type popularityScore')
        .lean(),
      engagementTrends: this.generateMockTrends(),
    };
  }

  /**
   * Generate mock engagement trends data
   */
  generateMockTrends() {
    const trends = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      trends.push({
        date: date.toISOString().split('T')[0],
        plays: Math.floor(Math.random() * 100) + 50,
        users: Math.floor(Math.random() * 50) + 20,
        duration: Math.floor(Math.random() * 300) + 180,
      });
    }

    return trends;
  }

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Get category list with admin-specific details
   */
  async getCategoryList(filters = {}, options = {}) {
    const { limit = 20, offset = 0, sort = 'sortOrder', order = 'asc', search } = options;

    const queryFilters = { ...filters };
    if (search) {
      queryFilters.search = search;
    }

    const [categories, total] = await Promise.all([
      categoryRepository.findWithContentCounts(queryFilters, { limit, offset, sort, order }),
      categoryRepository.countWithFilters(queryFilters),
    ]);

    return {
      categories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + categories.length < total,
      },
    };
  }

  /**
   * Create new category
   */
  async createCategory(categoryData) {
    // Generate slug from name if not provided
    if (!categoryData.slug) {
      categoryData.slug = this.generateSlug(categoryData.name);
    }

    // Ensure slug is unique
    const slugExists = await categoryRepository.slugExists(categoryData.slug);
    if (slugExists) {
      categoryData.slug = `${categoryData.slug}-${Date.now()}`;
    }

    const category = await categoryRepository.create(categoryData);

    logger.info({ categoryId: category._id, name: category.name }, 'Category created by admin');

    return category;
  }

  /**
   * Get category by ID with content count
   */
  async getCategoryById(id) {
    const category = await categoryRepository.findByIdWithContentCount(id);

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(id, updateData) {
    // If name is being updated and no slug provided, generate new slug
    if (updateData.name && !updateData.slug) {
      const newSlug = this.generateSlug(updateData.name);
      const slugExists = await categoryRepository.slugExists(newSlug, id);
      updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
    }

    // If slug is being updated, ensure it's unique
    if (updateData.slug) {
      const slugExists = await categoryRepository.slugExists(updateData.slug, id);
      if (slugExists) {
        const error = new Error('Category slug already exists');
        error.statusCode = 400;
        throw error;
      }
    }

    const category = await categoryRepository.updateById(id, updateData);

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    logger.info({ categoryId: id, updates: Object.keys(updateData) }, 'Category updated by admin');

    return category;
  }

  /**
   * Soft delete category (set isActive: false)
   */
  async deleteCategory(id) {
    // Check if category has active content
    const category = await categoryRepository.findByIdWithContentCount(id);

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    if (category.activeContentCount > 0) {
      const error = new Error(`Cannot delete category with ${category.activeContentCount} active content items. Move or delete the content first.`);
      error.statusCode = 400;
      error.code = 'CATEGORY_HAS_CONTENT';
      throw error;
    }

    const deletedCategory = await categoryRepository.softDeleteById(id);

    logger.info({ categoryId: id, name: category.name }, 'Category soft deleted by admin');

    return deletedCategory;
  }

  /**
   * Get content in a specific category
   */
  async getCategoryContent(categoryId, options = {}) {
    const { limit = 20, offset = 0, sort = 'createdAt', order = 'desc' } = options;

    // Verify category exists
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      throw error;
    }

    // Get content in this category
    const filters = { categoryId };
    const contentOptions = { limit, offset, sort, order };

    const [content, total] = await Promise.all([
      contentRepository.findWithFilters(filters, contentOptions),
      Content.countDocuments(filters),
    ]);

    return {
      category,
      content,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + content.length < total,
      },
    };
  }

  /**
   * Get category statistics
   */
  async getCategoryStats() {
    const stats = await categoryRepository.getStats();

    // Get additional stats
    const [
      mostPopularCategory,
      recentCategories,
      categoriesWithMostContent,
    ] = await Promise.all([
      Category.findOne({ isActive: true })
        .sort({ contentCount: -1 })
        .select('name contentCount')
        .lean(),
      Category.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name createdAt contentCount')
        .lean(),
      Category.find({ isActive: true, contentCount: { $gt: 0 } })
        .sort({ contentCount: -1 })
        .limit(10)
        .select('name contentCount')
        .lean(),
    ]);

    return {
      ...stats,
      mostPopularCategory,
      recentCategories,
      categoriesWithMostContent,
    };
  }

  /**
   * Update content counts for all categories
   */
  async updateCategoryContentCounts() {
    const categories = await categoryRepository.updateAllContentCounts();

    logger.info({ categoriesUpdated: categories.length }, 'Category content counts updated');

    return categories;
  }
}

module.exports = new AdminService();
