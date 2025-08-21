const { Favorite } = require('../models');

class FavoriteRepository {
  /**
   * Find favorites by kid ID
   */
  async findByKidId(kidId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return Favorite.find({ kidId })
      .populate('contentId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Find favorites by user ID
   */
  async findByUserId(userId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return Favorite.find({ userId })
      .populate(['kidId', 'contentId'])
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Add favorite
   */
  async addFavorite(userId, kidId, contentId) {
    try {
      const favorite = new Favorite({ userId, kidId, contentId });
      return await favorite.save();
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        throw new Error('Content is already in favorites for this kid');
      }
      throw error;
    }
  }

  /**
   * Remove favorite
   */
  async removeFavorite(kidId, contentId) {
    return Favorite.findOneAndDelete({ kidId, contentId });
  }

  /**
   * Check if content is favorite for kid
   */
  async isFavorite(kidId, contentId) {
    const favorite = await Favorite.findOne({ kidId, contentId }).lean();
    return !!favorite;
  }

  /**
   * Count favorites by kid ID
   */
  async countByKidId(kidId) {
    return Favorite.countDocuments({ kidId });
  }

  /**
   * Count favorites by user ID
   */
  async countByUserId(userId) {
    return Favorite.countDocuments({ userId });
  }

  /**
   * Find favorite by ID
   */
  async findById(id) {
    return Favorite.findById(id)
      .populate(['kidId', 'contentId'])
      .lean();
  }

  /**
   * Find favorites by content ID (to see who favorited what)
   */
  async findByContentId(contentId) {
    return Favorite.find({ contentId })
      .populate('kidId')
      .lean();
  }

  /**
   * Get user's favorites with kid and content details
   */
  async getUserFavoritesWithDetails(userId) {
    return Favorite.find({ userId })
      .populate({
        path: 'kidId',
        select: 'name ageRange avatarKey',
      })
      .populate({
        path: 'contentId',
        select: 'title type durationSec ageRange tags imageUrl audioUrl',
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get kid's favorites with content details
   */
  async getKidFavoritesWithDetails(kidId) {
    return Favorite.find({ kidId })
      .populate({
        path: 'contentId',
        select: 'title type durationSec ageRange tags imageUrl audioUrl popularityScore',
      })
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Remove all favorites for a kid
   */
  async removeAllByKidId(kidId) {
    return Favorite.deleteMany({ kidId });
  }

  /**
   * Remove all favorites for a user
   */
  async removeAllByUserId(userId) {
    return Favorite.deleteMany({ userId });
  }

  /**
   * Get most favorited content
   */
  async getMostFavorited(limit = 10) {
    return Favorite.aggregate([
      {
        $group: {
          _id: '$contentId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: '_id',
          as: 'content',
        },
      },
      {
        $unwind: '$content',
      },
      {
        $project: {
          _id: 0,
          contentId: '$_id',
          favoriteCount: '$count',
          content: 1,
        },
      },
    ]);
  }

  /**
   * Get favorites statistics for a user
   */
  async getUserFavoritesStats(userId) {
    return Favorite.aggregate([
      {
        $match: { userId },
      },
      {
        $lookup: {
          from: 'contents',
          localField: 'contentId',
          foreignField: '_id',
          as: 'content',
        },
      },
      {
        $unwind: '$content',
      },
      {
        $group: {
          _id: '$content.type',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);
  }
}

module.exports = new FavoriteRepository();
