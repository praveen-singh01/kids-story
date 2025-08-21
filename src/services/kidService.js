const kidRepository = require('../repositories/kidRepository');
const { cache, invalidateCache } = require('../loaders/redisLoader');
const logger = require('../utils/logger');

class KidService {
  /**
   * Get all kids for a user
   */
  async getKidsByUserId(userId) {
    return kidRepository.findByUserId(userId);
  }

  /**
   * Get kid by ID (with ownership verification)
   */
  async getKidById(kidId, userId) {
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    return kid;
  }

  /**
   * Create new kid profile
   */
  async createKid(userId, kidData) {
    // Check if user has reached the limit
    const existingCount = await kidRepository.countByUserId(userId);
    if (existingCount >= 5) {
      throw new Error('Maximum number of kid profiles reached (5)');
    }

    // Validate required fields
    const { name, ageRange, avatarKey } = kidData;
    if (!name || !ageRange) {
      throw new Error('Name and age range are required');
    }

    // Validate age range
    const validAgeRanges = ['3-5', '6-8', '9-12'];
    if (!validAgeRanges.includes(ageRange)) {
      throw new Error('Invalid age range');
    }

    const newKidData = {
      userId,
      name: name.trim(),
      ageRange,
      avatarKey: avatarKey || 'default-avatar',
      preferences: {
        sleepGoals: [],
        tags: [],
      },
    };

    const kid = await kidRepository.create(newKidData);
    
    // Invalidate user's cache
    await invalidateCache.user(userId);
    
    logger.info({ userId, kidId: kid._id, name }, 'Kid profile created');
    
    return kid;
  }

  /**
   * Update kid profile
   */
  async updateKid(kidId, userId, updateData) {
    // Validate ownership
    const existingKid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!existingKid) {
      throw new Error('Kid profile not found');
    }

    // Filter allowed fields
    const allowedFields = ['name', 'avatarKey', 'ageRange'];
    const filteredData = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        if (field === 'name') {
          filteredData[field] = updateData[field].trim();
        } else if (field === 'ageRange') {
          const validAgeRanges = ['3-5', '6-8', '9-12'];
          if (!validAgeRanges.includes(updateData[field])) {
            throw new Error('Invalid age range');
          }
          filteredData[field] = updateData[field];
        } else {
          filteredData[field] = updateData[field];
        }
      }
    }

    if (Object.keys(filteredData).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedKid = await kidRepository.updateByIdAndUserId(kidId, userId, filteredData);
    
    // Invalidate user's cache
    await invalidateCache.user(userId);
    
    logger.info({ userId, kidId, updatedFields: Object.keys(filteredData) }, 'Kid profile updated');
    
    return updatedKid;
  }

  /**
   * Delete kid profile
   */
  async deleteKid(kidId, userId) {
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }

    await kidRepository.deleteByIdAndUserId(kidId, userId);
    
    // TODO: Also delete related favorites
    // const favoriteRepository = require('../repositories/favoriteRepository');
    // await favoriteRepository.removeAllByKidId(kidId);
    
    // Invalidate user's cache
    await invalidateCache.user(userId);
    
    logger.info({ userId, kidId, name: kid.name }, 'Kid profile deleted');
    
    return true;
  }

  /**
   * Update kid preferences
   */
  async updateKidPreferences(kidId, userId, preferences) {
    // Validate ownership
    const existingKid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!existingKid) {
      throw new Error('Kid profile not found');
    }

    // Validate preferences
    const { sleepGoals, tags } = preferences;
    
    const validTags = [
      'folk_tales', 'affirmations', 'meditations', 'music', 
      'adventure', 'fantasy', 'educational', 'calming'
    ];
    
    const validatedPreferences = {
      sleepGoals: Array.isArray(sleepGoals) ? sleepGoals.filter(goal => 
        typeof goal === 'string' && goal.trim().length > 0
      ) : existingKid.preferences.sleepGoals,
      tags: Array.isArray(tags) ? tags.filter(tag => 
        validTags.includes(tag.toLowerCase())
      ) : existingKid.preferences.tags,
    };

    const updatedKid = await kidRepository.updatePreferences(kidId, userId, validatedPreferences);
    
    // Invalidate user's cache
    await invalidateCache.user(userId);
    
    logger.info({ 
      userId, 
      kidId, 
      sleepGoalsCount: validatedPreferences.sleepGoals.length,
      tagsCount: validatedPreferences.tags.length 
    }, 'Kid preferences updated');
    
    return updatedKid;
  }

  /**
   * Get kid preferences
   */
  async getKidPreferences(kidId, userId) {
    const preferences = await kidRepository.getPreferences(kidId, userId);
    if (!preferences) {
      throw new Error('Kid profile not found');
    }
    return preferences;
  }

  /**
   * Verify kid ownership
   */
  async verifyKidOwnership(kidId, userId) {
    return kidRepository.belongsToUser(kidId, userId);
  }

  /**
   * Get kids with pagination
   */
  async getKidsWithPagination(userId, limit = 10, offset = 0) {
    const kids = await kidRepository.findByUserIdWithPagination(userId, limit, offset);
    const total = await kidRepository.getTotalCountByUserId(userId);
    
    return {
      kids,
      total,
      limit,
      offset,
      hasMore: offset + kids.length < total,
    };
  }

  /**
   * Get kid statistics
   */
  async getKidStats(kidId, userId) {
    const kid = await this.getKidById(kidId, userId);
    
    // TODO: Add more statistics like favorite count, listening time, etc.
    // const favoriteRepository = require('../repositories/favoriteRepository');
    // const favoriteCount = await favoriteRepository.countByKidId(kidId);
    
    return {
      kid,
      stats: {
        favoriteCount: 0, // TODO: Implement
        preferencesSet: kid.preferences.tags.length > 0 || kid.preferences.sleepGoals.length > 0,
      },
    };
  }
}

module.exports = new KidService();
