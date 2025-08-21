const { z } = require('zod');

// Content validation schemas
const createContentSchema = z.object({
  body: z.object({
    type: z.enum(['story', 'affirmation', 'meditation', 'music']),
    title: z.string().min(1).max(200),
    slug: z.string().optional(),
    durationSec: z.number().int().min(1).max(3600),
    ageRange: z.enum(['3-5', '6-8', '9-12']),
    tags: z.array(z.enum(['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'])).optional(),
    language: z.string().default('en'),
    region: z.string().default('US'),
    audioUrl: z.string().url(),
    imageUrl: z.string().url(),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  }),
});

const updateContentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'),
  }),
  body: z.object({
    type: z.enum(['story', 'affirmation', 'meditation', 'music']).optional(),
    title: z.string().min(1).max(200).optional(),
    slug: z.string().optional(),
    durationSec: z.number().int().min(1).max(3600).optional(),
    ageRange: z.enum(['3-5', '6-8', '9-12']).optional(),
    tags: z.array(z.enum(['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'])).optional(),
    language: z.string().optional(),
    region: z.string().optional(),
    audioUrl: z.string().url().optional(),
    imageUrl: z.string().url().optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
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

module.exports = {
  createContentSchema,
  updateContentSchema,
  contentIdSchema,
  adminUserListSchema,
  updateUserSchema,
  uploadFileSchema,
  bulkUpdateContentSchema,
};
