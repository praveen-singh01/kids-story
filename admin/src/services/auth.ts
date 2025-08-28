import { apiService } from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/api';
import { LoginCredentials, AuthResponse, User } from '../types/auth';

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    if (response.success) {
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens and user data
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return {
        success: true,
        data: {
          user,
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: response.message,
      };
    }

    throw new Error(response.message || 'Login failed');
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshToken) {
        await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, { refreshToken });
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      this.clearStorage();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>(API_ENDPOINTS.AUTH.ME);
    
    if (response.success) {
      // Update stored user data
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      return response.data;
    }

    throw new Error(response.message || 'Failed to get current user');
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiService.post<{ accessToken: string; refreshToken: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken }
    );

    if (response.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    } else {
      throw new Error(response.message || 'Token refresh failed');
    }
  }

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  }

  getStoredToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user && user.roles.includes('admin'));
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

export const authService = new AuthService();
