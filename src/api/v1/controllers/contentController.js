const { contentService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class ContentController {
  /**
   * Get content by slug
   */
  async getContent(req, res, next) {
    try {
      const { slug } = req.params;
      
      const content = await contentService.getContentBySlug(slug);
      
      res.json(success(content, 'Content retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await contentService.getCategories();
      
      res.json(success(categories, 'Categories retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content list with filters
   */
  async getContentList(req, res, next) {
    try {
      const filters = contentService.validateFilters(req.query);
      const options = {
        sort: req.query.sort,
        limit: req.query.limit,
        offset: req.query.offset,
      };
      
      const result = await contentService.getContentList(filters, options);
      
      res.json(success(result, 'Content list retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Search content
   */
  async searchContent(req, res, next) {
    try {
      const { q: searchText } = req.query;
      const filters = contentService.validateFilters(req.query);
      const options = {
        limit: req.query.limit,
        offset: req.query.offset,
      };
      
      const content = await contentService.searchContent(searchText, filters, options);
      
      res.json(success(content, 'Search results retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get home page content
   */
  async getHomeContent(req, res, next) {
    try {
      const userId = req.userId;
      const { kidId } = req.query;
      
      const homeContent = await contentService.getHomeContent(userId, kidId);
      
      res.json(success(homeContent, 'Home content retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Increment content popularity
   */
  async incrementPopularity(req, res, next) {
    try {
      const { slug } = req.params;
      const { amount = 1 } = req.body;
      
      await contentService.incrementPopularity(slug, amount);
      
      res.json(success(null, 'Content popularity updated'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get content statistics (admin only)
   */
  async getContentStats(req, res, next) {
    try {
      const stats = await contentService.getContentStats();
      
      res.json(success(stats, 'Content statistics retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ContentController();
