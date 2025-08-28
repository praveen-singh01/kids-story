import { apiService } from './api';
import { API_ENDPOINTS } from '../constants/api';
import { ContentItem, PaginatedResponse, PaginationParams, UploadedFile, ContentFilesUpload } from '../types/api';

export interface ContentFilters {
  categoryId?: string;
  type?: string;
  ageRange?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CreateContentData {
  categoryId: string;
  type: 'story' | 'affirmation' | 'meditation' | 'music';
  title: string;
  slug?: string;
  durationSec: number;
  ageRange: '3-5' | '6-8' | '9-12';
  tags: string[];
  language?: string;
  region?: string;
  audioUrl: string;
  videoUrl?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediaMetadata?: {
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
  };
  isFeatured?: boolean;
  isActive?: boolean;
}

export interface UpdateContentData extends Partial<CreateContentData> {}

class ContentService {
  async getContentList(
    filters: ContentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<ContentItem>> {
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
      content: ContentItem[];
      pagination: PaginatedResponse<ContentItem>['pagination'];
    }>(`${API_ENDPOINTS.ADMIN.CONTENT}?${params.toString()}`);

    if (response.success) {
      return {
        items: response.data.content,
        pagination: response.data.pagination,
      };
    }

    throw new Error(response.message || 'Failed to fetch content');
  }

  async getContentById(id: string): Promise<ContentItem> {
    const response = await apiService.get<ContentItem>(
      API_ENDPOINTS.ADMIN.CONTENT_BY_ID(id)
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to fetch content');
  }

  async createContent(data: CreateContentData): Promise<ContentItem> {
    const response = await apiService.post<ContentItem>(
      API_ENDPOINTS.ADMIN.CONTENT,
      data
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to create content');
  }

  async updateContent(id: string, data: UpdateContentData): Promise<ContentItem> {
    const response = await apiService.put<ContentItem>(
      API_ENDPOINTS.ADMIN.CONTENT_BY_ID(id),
      data
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to update content');
  }

  async deleteContent(id: string): Promise<void> {
    const response = await apiService.delete(
      API_ENDPOINTS.ADMIN.CONTENT_BY_ID(id)
    );

    if (!response.success) {
      throw new Error(response.message || 'Failed to delete content');
    }
  }

  async bulkUpdateContent(
    ids: string[],
    updates: Partial<ContentItem>
  ): Promise<{ modifiedCount: number; matchedCount: number }> {
    const response = await apiService.post<{
      modifiedCount: number;
      matchedCount: number;
    }>(API_ENDPOINTS.ADMIN.BULK_UPDATE_CONTENT, { ids, updates });

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to bulk update content');
  }

  // File Upload Methods

  async uploadFile(file: File, categorySlug?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<UploadedFile>(
      API_ENDPOINTS.ADMIN.UPLOAD,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload file');
  }

  async uploadAudio(file: File, categorySlug?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('audio', file);
    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<UploadedFile>(
      API_ENDPOINTS.ADMIN.UPLOAD_AUDIO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload audio file');
  }

  async uploadVideo(file: File, categorySlug?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('video', file);
    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<UploadedFile>(
      API_ENDPOINTS.ADMIN.UPLOAD_VIDEO,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload video file');
  }

  async uploadImage(file: File, categorySlug?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('image', file);
    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<UploadedFile>(
      API_ENDPOINTS.ADMIN.UPLOAD_IMAGE,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload image file');
  }

  async uploadThumbnail(file: File, categorySlug?: string): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('thumbnail', file);
    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<UploadedFile>(
      API_ENDPOINTS.ADMIN.UPLOAD_THUMBNAIL,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload thumbnail file');
  }

  async uploadContentFiles(files: {
    audio?: File;
    video?: File;
    image?: File;
    thumbnail?: File;
  }, categorySlug?: string): Promise<ContentFilesUpload> {
    const formData = new FormData();

    if (files.audio) formData.append('audio', files.audio);
    if (files.video) formData.append('video', files.video);
    if (files.image) formData.append('image', files.image);
    if (files.thumbnail) formData.append('thumbnail', files.thumbnail);

    if (categorySlug) {
      formData.append('categorySlug', categorySlug);
    }

    const response = await apiService.post<ContentFilesUpload>(
      API_ENDPOINTS.ADMIN.UPLOAD_CONTENT,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    if (response.success) {
      return response.data;
    }

    throw new Error(response.message || 'Failed to upload content files');
  }
}

export const contentService = new ContentService();
