const favoriteRepository = require('../repositories/favoriteRepository');
const kidRepository = require('../repositories/kidRepository');
const contentRepository = require('../repositories/contentRepository');
// TODO: Redis temporarily disabled
// const { invalidateCache } = require('../loaders/redisLoader');
const logger = require('../utils/logger');

class FavoriteService {
  /**
   * Add content to favorites
   */
  async addFavorite(userId, kidId, contentId) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    // Verify content exists
    const content = await contentRepository.findById(contentId);
    if (!content || !content.isActive) {
      throw new Error('Content not found');
    }
    
    try {
      const favorite = await favoriteRepository.addFavorite(userId, kidId, contentId);
      
      // TODO: Redis temporarily disabled
      // Invalidate user's cache
      // await invalidateCache.user(userId);
      
      logger.info({ 
        userId, 
        kidId, 
        contentId, 
        contentTitle: content.title 
      }, 'Content added to favorites');
      
      return favorite;
    } catch (error) {
      if (error.message.includes('already in favorites')) {
        throw new Error('Content is already in favorites for this kid');
      }
      throw error;
    }
  }

  /**
   * Remove content from favorites
   */
  async removeFavorite(userId, kidId, contentId) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    const favorite = await favoriteRepository.removeFavorite(kidId, contentId);
    if (!favorite) {
      throw new Error('Favorite not found');
    }
    
    // TODO: Redis temporarily disabled
    // Invalidate user's cache
    // await invalidateCache.user(userId);
    
    logger.info({ userId, kidId, contentId }, 'Content removed from favorites');
    
    return true;
  }

  /**
   * Get favorites for a kid
   */
  async getKidFavorites(userId, kidId, options = {}) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    const { limit = 50, offset = 0 } = options;
    
    const favorites = await favoriteRepository.getKidFavoritesWithDetails(kidId);
    const total = await favoriteRepository.countByKidId(kidId);
    
    // Apply pagination
    const paginatedFavorites = favorites.slice(offset, offset + limit);
    
    return {
      favorites: paginatedFavorites.map(fav => ({
        id: fav._id,
        content: fav.contentId,
        addedAt: fav.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + paginatedFavorites.length < total,
      },
    };
  }

  /**
   * Get all favorites for a user
   */
  async getUserFavorites(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    const favorites = await favoriteRepository.getUserFavoritesWithDetails(userId);
    const total = await favoriteRepository.countByUserId(userId);
    
    // Apply pagination
    const paginatedFavorites = favorites.slice(offset, offset + limit);
    
    return {
      favorites: paginatedFavorites.map(fav => ({
        id: fav._id,
        kid: fav.kidId,
        content: fav.contentId,
        addedAt: fav.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + paginatedFavorites.length < total,
      },
    };
  }

  /**
   * Check if content is favorited by kid
   */
  async isFavorite(userId, kidId, contentId) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    return favoriteRepository.isFavorite(kidId, contentId);
  }

  /**
   * Get favorite counts for a kid
   */
  async getKidFavoriteCount(userId, kidId) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    return favoriteRepository.countByKidId(kidId);
  }

  /**
   * Get favorite statistics for a user
   */
  async getUserFavoriteStats(userId) {
    const stats = await favoriteRepository.getUserFavoritesStats(userId);
    const totalCount = await favoriteRepository.countByUserId(userId);
    
    return {
      totalFavorites: totalCount,
      byContentType: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
    };
  }

  /**
   * Remove all favorites for a kid
   */
  async removeAllKidFavorites(userId, kidId) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    const result = await favoriteRepository.removeAllByKidId(kidId);
    
    // TODO: Redis temporarily disabled
    // Invalidate user's cache
    // await invalidateCache.user(userId);
    
    logger.info({ userId, kidId, deletedCount: result.deletedCount }, 'All favorites removed for kid');
    
    return result.deletedCount;
  }

  /**
   * Get most favorited content globally
   */
  async getMostFavoritedContent(limit = 10) {
    return favoriteRepository.getMostFavorited(limit);
  }

  /**
   * Bulk add favorites
   */
  async bulkAddFavorites(userId, kidId, contentIds) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    const results = {
      added: [],
      skipped: [],
      errors: [],
    };
    
    for (const contentId of contentIds) {
      try {
        const favorite = await this.addFavorite(userId, kidId, contentId);
        results.added.push({ contentId, favoriteId: favorite._id });
      } catch (error) {
        if (error.message.includes('already in favorites')) {
          results.skipped.push({ contentId, reason: 'already_favorited' });
        } else {
          results.errors.push({ contentId, error: error.message });
        }
      }
    }
    
    logger.info({ 
      userId, 
      kidId, 
      totalRequested: contentIds.length,
      added: results.added.length,
      skipped: results.skipped.length,
      errors: results.errors.length 
    }, 'Bulk add favorites completed');
    
    return results;
  }
}

module.exports = new FavoriteService();
