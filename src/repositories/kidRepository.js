const { KidProfile } = require('../models');

class KidRepository {
  /**
   * Find kid by ID
   */
  async findById(id) {
    return KidProfile.findById(id).lean();
  }

  /**
   * Find kids by user ID
   */
  async findByUserId(userId) {
    return KidProfile.find({ userId }).sort({ createdAt: -1 }).lean();
  }

  /**
   * Find kid by ID and user ID (for ownership verification)
   */
  async findByIdAndUserId(id, userId) {
    return KidProfile.findOne({ _id: id, userId }).lean();
  }

  /**
   * Create new kid profile
   */
  async create(kidData) {
    const kid = new KidProfile(kidData);
    return kid.save();
  }

  /**
   * Update kid by ID
   */
  async updateById(id, updateData) {
    return KidProfile.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  /**
   * Update kid by ID and user ID (for ownership verification)
   */
  async updateByIdAndUserId(id, userId, updateData) {
    return KidProfile.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    ).lean();
  }

  /**
   * Delete kid by ID and user ID
   */
  async deleteByIdAndUserId(id, userId) {
    return KidProfile.findOneAndDelete({ _id: id, userId });
  }

  /**
   * Update kid preferences
   */
  async updatePreferences(id, userId, preferences) {
    return KidProfile.findOneAndUpdate(
      { _id: id, userId },
      { preferences },
      { new: true }
    ).lean();
  }

  /**
   * Count kids by user ID
   */
  async countByUserId(userId) {
    return KidProfile.countDocuments({ userId });
  }

  /**
   * Find kids by age range
   */
  async findByAgeRange(ageRange) {
    return KidProfile.find({ ageRange }).lean();
  }

  /**
   * Find kids with specific tags in preferences
   */
  async findByPreferenceTags(tags) {
    return KidProfile.find({
      'preferences.tags': { $in: tags }
    }).lean();
  }

  /**
   * Get kid preferences by ID and user ID
   */
  async getPreferences(id, userId) {
    const kid = await KidProfile.findOne({ _id: id, userId })
      .select('preferences')
      .lean();
    
    return kid ? kid.preferences : null;
  }

  /**
   * Check if kid belongs to user
   */
  async belongsToUser(kidId, userId) {
    const count = await KidProfile.countDocuments({ _id: kidId, userId });
    return count > 0;
  }

  /**
   * Find kids with pagination
   */
  async findByUserIdWithPagination(userId, limit = 10, offset = 0) {
    return KidProfile.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Get total count of kids for a user
   */
  async getTotalCountByUserId(userId) {
    return KidProfile.countDocuments({ userId });
  }
}

module.exports = new KidRepository();
