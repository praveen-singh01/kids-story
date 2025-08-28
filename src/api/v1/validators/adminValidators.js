const { z } = require('zod');

// Content validation schemas
const createContentSchema = z.object({
  body: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    type: z.enum(['story', 'affirmation', 'meditation', 'music']),
    title: z.string().min(1).max(200),
    slug: z.string().optional(),
    durationSec: z.number().int().min(1).max(3600),
    ageRange: z.enum(['3-5', '6-8', '9-12']),
    tags: z.array(z.enum(['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'])).optional(),
    language: z.string().default('en'),
    region: z.string().default('US'),
    audioUrl: z.string().url(),
    videoUrl: z.string().url().optional(),
    imageUrl: z.string().url(),
    thumbnailUrl: z.string().url().optional(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
    mediaMetadata: z.object({
      audioFormat: z.enum(['mp3', 'wav', 'aac', 'm4a']).optional(),
      videoFormat: z.enum(['mp4', 'webm', 'avi', 'mov']).optional(),
      thumbnailFormat: z.enum(['jpg', 'jpeg', 'png', 'webp']).optional(),
      fileSize: z.number().min(0).optional(),
      duration: z.number().min(0).optional(),
      bitrate: z.number().min(0).optional(),
      resolution: z.object({
        width: z.number().min(1),
        height: z.number().min(1),
      }).optional(),
    }).optional(),
  }),
});

const updateContentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'),
  }),
  body: z.object({
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID').optional(),
    type: z.enum(['story', 'affirmation', 'meditation', 'music']).optional(),
    title: z.string().min(1).max(200).optional(),
    slug: z.string().optional(),
    durationSec: z.number().int().min(1).max(3600).optional(),
    ageRange: z.enum(['3-5', '6-8', '9-12']).optional(),
    tags: z.array(z.enum(['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'])).optional(),
    language: z.string().optional(),
    region: z.string().optional(),
    audioUrl: z.string().url().optional(),
    videoUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    thumbnailUrl: z.string().url().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
    mediaMetadata: z.object({
      audioFormat: z.enum(['mp3', 'wav', 'aac', 'm4a']).optional(),
      videoFormat: z.enum(['mp4', 'webm', 'avi', 'mov']).optional(),
      thumbnailFormat: z.enum(['jpg', 'jpeg', 'png', 'webp']).optional(),
      fileSize: z.number().min(0).optional(),
      duration: z.number().min(0).optional(),
      bitrate: z.number().min(0).optional(),
      resolution: z.object({
        width: z.number().min(1),
        height: z.number().min(1),
      }).optional(),
    }).optional(),
  }),
});

const contentIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'),
  }),
});

// User validation schemas
const adminUserListSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    plan: z.enum(['free', 'premium', 'family']).optional(),
    status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
    provider: z.enum(['google', 'local']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n >= 1 && n <= 100).optional(),
    offset: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.enum(['createdAt', 'lastLoginAt', 'email', 'name']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    roles: z.array(z.enum(['user', 'admin'])).optional(),
    isEmailVerified: z.boolean().optional(),
    subscription: z.object({
      plan: z.enum(['free', 'premium', 'family']).optional(),
      status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
    }).optional(),
  }),
});

// File upload validation
const uploadFileSchema = z.object({
  body: z.object({
    type: z.enum(['audio', 'image', 'content']).optional(),
  }),
});

// Bulk operations
const bulkUpdateContentSchema = z.object({
  body: z.object({
    ids: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1).max(100),
    updates: z.object({
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      tags: z.array(z.enum(['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'])).optional(),
    }).refine(obj => Object.keys(obj).length > 0, 'At least one update field is required'),
  }),
});

// Category validation schemas
const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
    slug: z.string().optional(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
    metadata: z.object({
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').default('#6366f1'),
      icon: z.string().min(1).default('folder'),
      imageUrl: z.string().url().optional(),
    }).optional(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().min(1).max(500).optional(),
    slug: z.string().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    metadata: z.object({
      color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
      icon: z.string().min(1).optional(),
      imageUrl: z.string().url().optional(),
    }).optional(),
  }).refine(obj => Object.keys(obj).length > 0, 'At least one update field is required'),
});

const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
});

const categoryListSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['name', 'createdAt', 'updatedAt', 'contentCount', 'sortOrder']).default('sortOrder'),
    order: z.enum(['asc', 'desc']).default('asc'),
    isActive: z.coerce.boolean().optional(),
    q: z.string().min(1).optional(), // search query
  }),
});

const categoryContentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    sort: z.enum(['title', 'createdAt', 'updatedAt', 'popularityScore']).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
});

module.exports = {
  createContentSchema,
  updateContentSchema,
  contentIdSchema,
  adminUserListSchema,
  updateUserSchema,
  uploadFileSchema,
  bulkUpdateContentSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  categoryListSchema,
  categoryContentSchema,
};
