export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api/v1';

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  
  // Admin endpoints
  ADMIN: {
    // Content management
    CONTENT: '/admin/content',
    CONTENT_BY_ID: (id: string) => `/admin/content/${id}`,
    BULK_UPDATE_CONTENT: '/admin/content/bulk-update',

    // Category management
    CATEGORIES: '/admin/categories',
    CATEGORY_BY_ID: (id: string) => `/admin/categories/${id}`,
    CATEGORY_CONTENT: (id: string) => `/admin/categories/${id}/content`,
    UPDATE_CATEGORY_COUNTS: '/admin/categories/update-counts',

    // User management
    USERS: '/admin/users',
    USER_BY_ID: (id: string) => `/admin/users/${id}`,

    // File upload
    UPLOAD: '/admin/upload',
    UPLOAD_AUDIO: '/admin/upload/audio',
    UPLOAD_VIDEO: '/admin/upload/video',
    UPLOAD_IMAGE: '/admin/upload/image',
    UPLOAD_THUMBNAIL: '/admin/upload/thumbnail',
    UPLOAD_CONTENT: '/admin/upload/content',

    // Statistics
    STATS: {
      OVERVIEW: '/admin/stats/overview',
      CONTENT: '/admin/stats/content',
      USERS: '/admin/stats/users',
      ENGAGEMENT: '/admin/stats/engagement',
      CATEGORIES: '/admin/stats/categories',
    },

    // System
    SYSTEM: {
      HEALTH: '/admin/system/health',
      CLEAR_CACHE: '/admin/system/cache/clear',
    },
  },
} as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'admin_access_token',
  REFRESH_TOKEN: 'admin_refresh_token',
  USER: 'admin_user',
} as const;
