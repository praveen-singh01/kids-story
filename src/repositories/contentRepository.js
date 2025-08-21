const { Content } = require('../models');

class ContentRepository {
  /**
   * Find content by ID
   */
  async findById(id) {
    return Content.findById(id).lean();
  }

  /**
   * Find content by slug
   */
  async findBySlug(slug) {
    return Content.findOne({ slug, isActive: true }).lean();
  }

  /**
   * Find content with pagination and filters
   */
  async findWithFilters(filters = {}, options = {}) {
    const {
      type,
      ageRange,
      tags,
      isFeatured,
      language = 'en',
      region = 'US',
    } = filters;

    const {
      sort = 'popular',
      limit = 10,
      offset = 0,
    } = options;

    // Build query
    const query = { isActive: true, language, region };
    
    if (type) query.type = type;
    if (ageRange) query.ageRange = ageRange;
    if (tags && tags.length > 0) query.tags = { $in: tags };
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    // Build sort
    let sortQuery = {};
    switch (sort) {
      case 'new':
        sortQuery = { publishedAt: -1 };
        break;
      case 'popular':
        sortQuery = { isFeatured: -1, popularityScore: -1, publishedAt: -1 };
        break;
      case 'duration':
        sortQuery = { durationSec: 1 };
        break;
      default:
        sortQuery = { isFeatured: -1, popularityScore: -1, publishedAt: -1 };
    }

    return Content.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Count content with filters
   */
  async countWithFilters(filters = {}) {
    const {
      type,
      ageRange,
      tags,
      isFeatured,
      language = 'en',
      region = 'US',
    } = filters;

    const query = { isActive: true, language, region };
    
    if (type) query.type = type;
    if (ageRange) query.ageRange = ageRange;
    if (tags && tags.length > 0) query.tags = { $in: tags };
    if (isFeatured !== undefined) query.isFeatured = isFeatured;

    return Content.countDocuments(query);
  }

  /**
   * Find recommended content for kid
   */
  async findRecommended(ageRange, tags = [], limit = 10) {
    return Content.findRecommended(ageRange, tags, limit);
  }

  /**
   * Find featured content
   */
  async findFeatured(limit = 5) {
    return Content.find({ isFeatured: true, isActive: true })
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Find content by type and age range
   */
  async findByTypeAndAge(type, ageRange, options = {}) {
    return Content.findByTypeAndAge(type, ageRange, options);
  }

  /**
   * Search content by text
   */
  async searchByText(searchText, filters = {}, options = {}) {
    const {
      type,
      ageRange,
      tags,
      language = 'en',
      region = 'US',
    } = filters;

    const {
      limit = 10,
      offset = 0,
    } = options;

    const query = {
      $text: { $search: searchText },
      isActive: true,
      language,
      region,
    };
    
    if (type) query.type = type;
    if (ageRange) query.ageRange = ageRange;
    if (tags && tags.length > 0) query.tags = { $in: tags };

    return Content.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .skip(offset)
      .lean();
  }

  /**
   * Get content categories (distinct types)
   */
  async getCategories() {
    return Content.distinct('type', { isActive: true });
  }

  /**
   * Get content tags
   */
  async getTags() {
    return Content.distinct('tags', { isActive: true });
  }

  /**
   * Get content age ranges
   */
  async getAgeRanges() {
    return Content.distinct('ageRange', { isActive: true });
  }

  /**
   * Increment content popularity
   */
  async incrementPopularity(id, amount = 1) {
    return Content.findByIdAndUpdate(
      id,
      { $inc: { popularityScore: amount } },
      { new: true }
    ).lean();
  }

  /**
   * Find content by IDs
   */
  async findByIds(ids) {
    return Content.find({ _id: { $in: ids }, isActive: true }).lean();
  }

  /**
   * Create new content
   */
  async create(contentData) {
    const content = new Content(contentData);
    return content.save();
  }

  /**
   * Update content by ID
   */
  async updateById(id, updateData) {
    return Content.findByIdAndUpdate(id, updateData, { new: true }).lean();
  }

  /**
   * Delete content by ID (soft delete)
   */
  async deleteById(id) {
    return Content.findByIdAndUpdate(id, { isActive: false }, { new: true }).lean();
  }

  /**
   * Find recently published content
   */
  async findRecent(limit = 10) {
    return Content.find({ isActive: true })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Find popular content
   */
  async findPopular(limit = 10) {
    return Content.find({ isActive: true })
      .sort({ popularityScore: -1, publishedAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new ContentRepository();
