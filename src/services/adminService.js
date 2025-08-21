const contentRepository = require('../repositories/contentRepository');
const userRepository = require('../repositories/userRepository');
const kidRepository = require('../repositories/kidRepository');
const favoriteRepository = require('../repositories/favoriteRepository');
const { Content, User, KidProfile } = require('../models');
const { cache } = require('../loaders/redisLoader');
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
    
    // Clear relevant caches
    await this.clearContentCaches();
    
    logger.info({ contentId: content._id, title: content.title }, 'Content created by admin');
    
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
      throw new Error('Content not found');
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
    
    // Clear relevant caches
    await this.clearContentCaches();
    
    logger.info({ contentId: id, updates: Object.keys(updateData) }, 'Content updated by admin');
    
    return content;
  }

  /**
   * Delete content
   */
  async deleteContent(id) {
    const content = await Content.findById(id);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Remove from favorites
    await favoriteRepository.removeContentFromAllFavorites(id);
    
    // Delete the content
    await Content.findByIdAndDelete(id);
    
    // Clear relevant caches
    await this.clearContentCaches();
    
    logger.info({ contentId: id, title: content.title }, 'Content deleted by admin');
    
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
    
    // Clear user cache
    await cache.del(`user:${id}`);
    
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
    
    // Clear user cache
    await cache.del(`user:${id}`);
    
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
    
    for (const pattern of cacheKeys) {
      const keys = await cache.keys(pattern);
      if (keys.length > 0) {
        await cache.del(...keys);
      }
    }
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
}

module.exports = new AdminService();
