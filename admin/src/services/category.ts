import { apiService } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { CategoryItem, PaginatedResponse, PaginationParams, ContentItem } from '../types/api';

export interface CategoryFilters {
  isActive?: boolean;
}

export interface CreateCategoryData {
  name: string;
  description: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: {
    color?: string;
    icon?: string;
    imageUrl?: string;
  };
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export interface CategoryContentParams extends PaginationParams {
  sort?: 'title' | 'createdAt' | 'updatedAt' | 'popularityScore';
}

class CategoryService {
  /**
   * Get paginated list of categories
   */
  async getCategories(
    filters: CategoryFilters = {},
    params: PaginationParams = {}
  ): Promise<PaginatedResponse<CategoryItem>> {
    const queryParams = new URLSearchParams();
    
    // Add pagination params
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);
    if (params.search) queryParams.append('q', params.search);
    
    // Add filters
    if (filters.isActive !== undefined) {
      queryParams.append('isActive', filters.isActive.toString());
    }

    const response = await apiService.get<{
      categories: CategoryItem[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`${API_ENDPOINTS.ADMIN.CATEGORIES}?${queryParams.toString()}`);

    if (response.success) {
      return {
        items: response.data.categories,
        pagination: response.data.pagination,
      };
    }

    throw new Error(response.message || 'Failed to fetch categories');
  }

  /**
   * Get all active categories (for dropdowns)
   */
  async getActiveCategories(): Promise<CategoryItem[]> {
    const response = await this.getCategories({ isActive: true }, { limit: 100 });
    return response.items;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<CategoryItem> {
    const response = await apiService.get<CategoryItem>(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch category');
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryData): Promise<CategoryItem> {
    const response = await apiService.post<CategoryItem>(
      API_ENDPOINTS.ADMIN.CATEGORIES,
      data
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create category');
  }

  /**
   * Update category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<CategoryItem> {
    const response = await apiService.put<CategoryItem>(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`,
      data
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update category');
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: string): Promise<void> {
    const response = await apiService.delete(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/${id}`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete category');
    }
  }

  /**
   * Get content in a specific category
   */
  async getCategoryContent(
    categoryId: string,
    params: CategoryContentParams = {}
  ): Promise<{
    category: CategoryItem;
    content: ContentItem[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const queryParams = new URLSearchParams();
    
    // Add pagination params
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.sort) queryParams.append('sort', params.sort);
    if (params.order) queryParams.append('order', params.order);

    const response = await apiService.get<{
      category: CategoryItem;
      content: ContentItem[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
    }>(`${API_ENDPOINTS.ADMIN.CATEGORIES}/${categoryId}/content?${queryParams.toString()}`);

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch category content');
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    categoriesWithContent: number;
    emptyCategoriesCount: number;
    avgContentPerCategory: number;
    mostPopularCategory?: {
      name: string;
      contentCount: number;
    };
    recentCategories: Array<{
      name: string;
      createdAt: string;
      contentCount: number;
    }>;
    categoriesWithMostContent: Array<{
      name: string;
      contentCount: number;
    }>;
  }> {
    const response = await apiService.get(API_ENDPOINTS.ADMIN.STATS.CATEGORIES);

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch category statistics');
  }

  /**
   * Update category content counts
   */
  async updateContentCounts(): Promise<void> {
    const response = await apiService.post(
      `${API_ENDPOINTS.ADMIN.CATEGORIES}/update-counts`
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to update category content counts');
    }
  }

  /**
   * Reorder categories
   */
  async reorderCategories(categoryIds: string[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sortOrder: index,
    }));

    // Update each category's sort order
    await Promise.all(
      updates.map(({ id, sortOrder }) =>
        this.updateCategory(id, { sortOrder })
      )
    );
  }
}

export const categoryService = new CategoryService();
