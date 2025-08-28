const { Category, Content } = require('../models');

class CategoryRepository {
  /**
   * Find category by ID
   */
  async findById(id) {
    const category = await Category.findById(id).lean();
    if (!category) return null;

    return {
      ...category,
      id: category._id.toString(),
    };
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug) {
    const category = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) return null;

    return {
      ...category,
      id: category._id.toString(),
    };
  }

  /**
   * Find all categories with filters and pagination
   */
  async findWithFilters(filters = {}, options = {}) {
    const {
      isActive,
      search,
    } = filters;

    const {
      sort = 'sortOrder',
      order = 'asc',
      limit = 20,
      offset = 0,
    } = options;

    // Build query
    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive;
    
    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortQuery = {};
    const sortOrder = order === 'desc' ? -1 : 1;
    
    switch (sort) {
      case 'name':
        sortQuery = { name: sortOrder };
        break;
      case 'createdAt':
        sortQuery = { createdAt: sortOrder };
        break;
      case 'updatedAt':
        sortQuery = { updatedAt: sortOrder };
        break;
      case 'contentCount':
        sortQuery = { contentCount: sortOrder };
        break;
      case 'sortOrder':
      default:
        sortQuery = { sortOrder: sortOrder, name: 1 };
        break;
    }

    // Add text score sorting if searching
    if (search) {
      sortQuery = { score: { $meta: 'textScore' }, ...sortQuery };
    }

    const categories = await Category.find(query)
      .sort(sortQuery)
      .limit(limit)
      .skip(offset)
      .lean();

    // Transform _id to id for API compatibility
    return categories.map(category => ({
      ...category,
      id: category._id.toString(),
    }));
  }

  /**
   * Count categories with filters
   */
  async countWithFilters(filters = {}) {
    const {
      isActive,
      search,
    } = filters;

    const query = {};
    
    if (isActive !== undefined) query.isActive = isActive;
    
    if (search) {
      query.$text = { $search: search };
    }

    return Category.countDocuments(query);
  }

  /**
   * Find all active categories
   */
  async findActive(options = {}) {
    const {
      limit,
      offset = 0,
    } = options;

    const query = Category.findActive();
    
    if (limit) query.limit(limit);
    if (offset) query.skip(offset);
    
    return query.lean();
  }

  /**
   * Create new category
   */
  async create(categoryData) {
    const category = new Category(categoryData);
    return category.save();
  }

  /**
   * Update category by ID
   */
  async updateById(id, updateData) {
    return Category.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Soft delete category (set isActive: false)
   */
  async softDeleteById(id) {
    return Category.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    ).lean();
  }

  /**
   * Hard delete category (only if no content)
   */
  async deleteById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new Error('Category not found');
    }
    
    // Check if category has content
    const contentCount = await Content.countDocuments({ 
      categoryId: id, 
      isActive: true 
    });
    
    if (contentCount > 0) {
      throw new Error(`Cannot delete category with ${contentCount} active content items`);
    }
    
    return Category.findByIdAndDelete(id).lean();
  }

  /**
   * Get category with content count
   */
  async findByIdWithContentCount(id) {
    const category = await Category.findById(id).lean();
    if (!category) return null;
    
    const contentCount = await Content.countDocuments({ 
      categoryId: id, 
      isActive: true 
    });
    
    return {
      ...category,
      activeContentCount: contentCount,
    };
  }

  /**
   * Get categories with content counts
   */
  async findWithContentCounts(filters = {}, options = {}) {
    const categories = await this.findWithFilters(filters, options);
    
    // Get content counts for all categories
    const categoryIds = categories.map(cat => cat.id);
    const contentCounts = await Content.aggregate([
      {
        $match: {
          categoryId: { $in: categoryIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
        },
      },
    ]);
    
    // Map counts to categories
    const countMap = contentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {});
    
    return categories.map(category => ({
      ...category,
      activeContentCount: countMap[category.id] || 0,
    }));
  }

  /**
   * Update content counts for all categories
   */
  async updateAllContentCounts() {
    return Category.updateContentCounts();
  }

  /**
   * Check if category slug exists
   */
  async slugExists(slug, excludeId = null) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const category = await Category.findOne(query);
    return !!category;
  }

  /**
   * Get category statistics
   */
  async getStats() {
    const [
      totalCategories,
      activeCategories,
      categoriesWithContent,
      avgContentPerCategory,
    ] = await Promise.all([
      Category.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ contentCount: { $gt: 0 } }),
      Category.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, avgContent: { $avg: '$contentCount' } } },
      ]),
    ]);

    return {
      totalCategories,
      activeCategories,
      inactiveCategories: totalCategories - activeCategories,
      categoriesWithContent,
      emptyCategoriesCount: activeCategories - categoriesWithContent,
      avgContentPerCategory: avgContentPerCategory[0]?.avgContent || 0,
    };
  }
}

module.exports = new CategoryRepository();
