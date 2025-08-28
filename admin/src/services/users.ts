import { apiService } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { UserItem, PaginatedResponse, PaginationParams } from '../types/api';

export interface UserFilters {
  plan?: string;
  status?: string;
  provider?: string;
}

class UserService {
  async getUserList(
    filters: UserFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<UserItem>> {
    const params = new URLSearchParams();
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    // Add pagination
    Object.entries(pagination).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<{
      users: UserItem[];
      pagination: PaginatedResponse<UserItem>['pagination'];
    }>(`${API_ENDPOINTS.ADMIN.USERS}?${params.toString()}`);

    if (response.success) {
      return {
        items: response.data.users,
        pagination: response.data.pagination,
      };
    }

    throw new Error(response.message || 'Failed to fetch users');
  }

  async getUserById(id: string): Promise<UserItem> {
    const response = await apiService.get<UserItem>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(id)
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch user');
  }

  async updateUser(id: string, data: Partial<UserItem>): Promise<UserItem> {
    const response = await apiService.put<UserItem>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(id),
      data
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update user');
  }

  async deleteUser(id: string): Promise<void> {
    const response = await apiService.delete(
      API_ENDPOINTS.ADMIN.USER_BY_ID(id)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete user');
    }
  }
}

export const userService = new UserService();
