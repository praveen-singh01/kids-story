export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error: string[];
  message: string;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  slug: string;
  isActive: boolean;
  contentCount: number;
  activeContentCount?: number;
  sortOrder: number;
  metadata: {
    color: string;
    icon: string;
    imageUrl?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MediaMetadata {
  audioFormat?: 'mp3' | 'wav' | 'aac' | 'm4a';
  videoFormat?: 'mp4' | 'webm' | 'avi' | 'mov';
  thumbnailFormat?: 'jpg' | 'jpeg' | 'png' | 'webp';
  fileSize?: number;
  duration?: number;
  bitrate?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface ContentItem {
  id: string;
  categoryId: string;
  category?: CategoryItem;
  type: 'story' | 'affirmation' | 'meditation' | 'music';
  title: string;
  slug: string;
  durationSec: number;
  ageRange: '3-5' | '6-8' | '9-12';
  tags: string[];
  language: string;
  region: string;
  audioUrl: string;
  videoUrl?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediaMetadata?: MediaMetadata;
  isFeatured: boolean;
  popularityScore: number;
  publishedAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedFile {
  url: string;
  fullUrl?: string;
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
  metadata?: any;
}

export interface ContentFilesUpload {
  audio?: UploadedFile;
  video?: UploadedFile;
  image?: UploadedFile;
  thumbnail?: UploadedFile;
}

export interface UserItem {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'local';
  roles: string[];
  subscription: {
    plan: 'free' | 'premium' | 'family';
    status: 'active' | 'inactive' | 'cancelled' | 'past_due';
    currentPeriodEnd?: string;
  };
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
  kidsCount?: number;
  favoritesCount?: number;
}

export interface OverviewStats {
  totalContent: number;
  totalUsers: number;
  totalKids: number;
  activeUsers: number;
  contentByType: Record<string, number>;
  usersByPlan: Record<string, number>;
  recentContent: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
  recentUsers: Array<{
    id: string;
    email: string;
    name: string;
    createdAt: string;
  }>;
}
