const { kidService } = require('../../../services');
const { success, error } = require('../../../utils/envelope');

class KidController {
  /**
   * Get all kids for current user
   */
  async getKids(req, res, next) {
    try {
      const userId = req.userId;
      
      const kids = await kidService.getKidsByUserId(userId);
      
      res.json(success(kids, 'Kids retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get kid by ID
   */
  async getKidById(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const kid = await kidService.getKidById(id, userId);
      
      res.json(success(kid, 'Kid retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new kid profile
   */
  async createKid(req, res, next) {
    try {
      const userId = req.userId;
      const kidData = req.body;
      
      const kid = await kidService.createKid(userId, kidData);
      
      res.status(201).json(success(kid, 'Kid profile created successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update kid profile
   */
  async updateKid(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const updateData = req.body;
      
      const kid = await kidService.updateKid(id, userId, updateData);
      
      res.json(success(kid, 'Kid profile updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete kid profile
   */
  async deleteKid(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      await kidService.deleteKid(id, userId);
      
      res.json(success(null, 'Kid profile deleted successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update kid preferences
   */
  async updatePreferences(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const preferences = req.body;
      
      const kid = await kidService.updateKidPreferences(id, userId, preferences);
      
      res.json(success(kid, 'Kid preferences updated successfully'));
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get kid preferences
   */
  async getPreferences(req, res, next) {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const preferences = await kidService.getKidPreferences(id, userId);
      
      res.json(success(preferences, 'Kid preferences retrieved successfully'));
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new KidController();
