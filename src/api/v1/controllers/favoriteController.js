const { favoriteService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class FavoriteController {
  /**
   * Add content to favorites
   */
  async addFavorite(req, res, next) {
    try {
      const userId = req.userId;
      const { kidId, contentId } = req.body;
      
      const favorite = await favoriteService.addFavorite(userId, kidId, contentId);
      
      res.status(201).json(success(favorite, 'Content added to favorites'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove content from favorites
   */
  async removeFavorite(req, res, next) {
    try {
      const userId = req.userId;
      const { contentId } = req.params;
      const { kidId } = req.query;
      
      await favoriteService.removeFavorite(userId, kidId, contentId);
      
      res.json(success(null, 'Content removed from favorites'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get favorites
   */
  async getFavorites(req, res, next) {
    try {
      const userId = req.userId;
      const { kidId, limit, offset } = req.query;
      
      let result;
      if (kidId) {
        // Get favorites for specific kid
        result = await favoriteService.getKidFavorites(userId, kidId, { limit, offset });
      } else {
        // Get all favorites for user
        result = await favoriteService.getUserFavorites(userId, { limit, offset });
      }
      
      res.json(success(result, 'Favorites retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check if content is favorited
   */
  async checkFavorite(req, res, next) {
    try {
      const userId = req.userId;
      const { contentId } = req.params;
      const { kidId } = req.query;
      
      if (!kidId) {
        return res.status(400).json(error(['MISSING_KID_ID'], 'Kid ID is required'));
      }
      
      const isFavorite = await favoriteService.isFavorite(userId, kidId, contentId);
      
      res.json(success({ isFavorite }, 'Favorite status retrieved'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get favorite statistics for user
   */
  async getFavoriteStats(req, res, next) {
    try {
      const userId = req.userId;
      
      const stats = await favoriteService.getUserFavoriteStats(userId);
      
      res.json(success(stats, 'Favorite statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Bulk add favorites
   */
  async bulkAddFavorites(req, res, next) {
    try {
      const userId = req.userId;
      const { kidId, contentIds } = req.body;
      
      const result = await favoriteService.bulkAddFavorites(userId, kidId, contentIds);
      
      res.json(success(result, 'Bulk add favorites completed'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove all favorites for a kid
   */
  async removeAllKidFavorites(req, res, next) {
    try {
      const userId = req.userId;
      const { id: kidId } = req.params;
      
      const deletedCount = await favoriteService.removeAllKidFavorites(userId, kidId);
      
      res.json(success({ deletedCount }, 'All favorites removed for kid'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get most favorited content (admin only)
   */
  async getMostFavorited(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      
      const content = await favoriteService.getMostFavoritedContent(parseInt(limit));
      
      res.json(success(content, 'Most favorited content retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new FavoriteController();
