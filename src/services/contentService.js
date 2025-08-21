const contentRepository = require('../repositories/contentRepository');
const kidRepository = require('../repositories/kidRepository');
const favoriteRepository = require('../repositories/favoriteRepository');
const { Highlight } = require('../models');
const config = require('../config');
const logger = require('../utils/logger');

class ContentService {
  /**
   * Get content by slug
   */
  async getContentBySlug(slug) {
    const content = await contentRepository.findBySlug(slug);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Build full URLs
    return this.buildContentUrls(content);
  }

  /**
   * Get content list with filters and pagination
   */
  async getContentList(filters = {}, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    // Validate limit
    const maxLimit = 50;
    const validatedLimit = Math.min(Math.max(1, parseInt(limit)), maxLimit);
    const validatedOffset = Math.max(0, parseInt(offset));
    
    const content = await contentRepository.findWithFilters(filters, {
      ...options,
      limit: validatedLimit,
      offset: validatedOffset,
    });
    
    const total = await contentRepository.countWithFilters(filters);
    
    return {
      content: content.map(item => this.buildContentUrls(item)),
      pagination: {
        total,
        limit: validatedLimit,
        offset: validatedOffset,
        hasMore: validatedOffset + content.length < total,
      },
    };
  }

  /**
   * Get content categories
   */
  async getCategories() {
    return contentRepository.getCategories();
  }

  /**
   * Search content
   */
  async searchContent(searchText, filters = {}, options = {}) {
    if (!searchText || searchText.trim().length < 2) {
      throw new Error('Search text must be at least 2 characters');
    }
    
    const content = await contentRepository.searchByText(searchText.trim(), filters, options);
    
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Get recommended content for kid
   */
  async getRecommendedContent(kidId, userId, limit = 10) {
    // Verify kid ownership
    const kid = await kidRepository.findByIdAndUserId(kidId, userId);
    if (!kid) {
      throw new Error('Kid profile not found');
    }
    
    const { ageRange, preferences } = kid;
    const tags = preferences.tags || [];
    
    const content = await contentRepository.findRecommended(ageRange, tags, limit);
    
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Get home page content (highlights + recommendations)
   */
  async getHomeContent(userId, kidId = null) {
    const result = {
      highlights: [],
      recommended: [],
      featured: [],
    };
    
    // Get current highlights
    const highlights = await Highlight.findCurrent();
    result.highlights = highlights.map(highlight => ({
      ...highlight.toObject(),
      contentIds: highlight.contentIds.map(content => this.buildContentUrls(content)),
    }));
    
    // Get featured content
    const featured = await contentRepository.findFeatured(5);
    result.featured = featured.map(item => this.buildContentUrls(item));
    
    // Get recommended content if kid is specified
    if (kidId) {
      try {
        result.recommended = await this.getRecommendedContent(kidId, userId, 10);
      } catch (error) {
        logger.warn({ error: error.message, kidId, userId }, 'Failed to get recommended content');
        // Fall back to popular content
        const popular = await contentRepository.findPopular(10);
        result.recommended = popular.map(item => this.buildContentUrls(item));
      }
    } else {
      // No kid specified, return popular content
      const popular = await contentRepository.findPopular(10);
      result.recommended = popular.map(item => this.buildContentUrls(item));
    }
    
    return result;
  }

  /**
   * Increment content popularity (when played)
   */
  async incrementPopularity(slug, amount = 1) {
    const content = await contentRepository.findBySlug(slug);
    if (!content) {
      throw new Error('Content not found');
    }
    
    await contentRepository.incrementPopularity(content._id, amount);
    
    logger.info({ contentId: content._id, slug, amount }, 'Content popularity incremented');
    
    return true;
  }

  /**
   * Get content by multiple IDs
   */
  async getContentByIds(ids) {
    const content = await contentRepository.findByIds(ids);
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Get recent content
   */
  async getRecentContent(limit = 10) {
    const content = await contentRepository.findRecent(limit);
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Get popular content
   */
  async getPopularContent(limit = 10) {
    const content = await contentRepository.findPopular(limit);
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Get content by type and age range
   */
  async getContentByTypeAndAge(type, ageRange, options = {}) {
    const content = await contentRepository.findByTypeAndAge(type, ageRange, options);
    return content.map(item => this.buildContentUrls(item));
  }

  /**
   * Build full URLs for content assets
   */
  buildContentUrls(content) {
    if (!content) return content;
    
    return {
      ...content,
      audioUrl: this.buildAssetUrl(content.audioUrl),
      imageUrl: this.buildAssetUrl(content.imageUrl),
    };
  }

  /**
   * Build full asset URL
   */
  buildAssetUrl(relativePath) {
    if (!relativePath) return null;
    
    // If already a full URL, return as is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
      return relativePath;
    }
    
    // Build full URL with CDN base
    return `${config.cdnBase}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
  }

  /**
   * Get content statistics
   */
  async getContentStats() {
    const categories = await this.getCategories();
    const tags = await contentRepository.getTags();
    const ageRanges = await contentRepository.getAgeRanges();
    
    const stats = {};
    for (const category of categories) {
      stats[category] = await contentRepository.countWithFilters({ type: category });
    }
    
    return {
      totalContent: await contentRepository.countWithFilters(),
      byCategory: stats,
      categories,
      tags,
      ageRanges,
    };
  }

  /**
   * Validate content filters
   */
  validateFilters(filters) {
    const validTypes = ['story', 'affirmation', 'meditation', 'music'];
    const validAgeRanges = ['3-5', '6-8', '9-12'];
    const validTags = [
      'folk_tales', 'affirmations', 'meditations', 'music', 
      'adventure', 'fantasy', 'educational', 'calming'
    ];
    const validSorts = ['popular', 'new', 'duration'];
    
    const validated = {};
    
    if (filters.type && validTypes.includes(filters.type)) {
      validated.type = filters.type;
    }
    
    if (filters.ageRange && validAgeRanges.includes(filters.ageRange)) {
      validated.ageRange = filters.ageRange;
    }
    
    if (filters.tags && Array.isArray(filters.tags)) {
      validated.tags = filters.tags.filter(tag => validTags.includes(tag));
    }
    
    if (filters.isFeatured !== undefined) {
      validated.isFeatured = Boolean(filters.isFeatured);
    }
    
    return validated;
  }
}

module.exports = new ContentService();
