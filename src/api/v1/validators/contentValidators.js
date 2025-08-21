const { z } = require('zod');

// Content slug validator
const contentSlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Content slug is required'),
  }),
});

// Explore list validator
const exploreListSchema = z.object({
  query: z.object({
    type: z.enum(['story', 'affirmation', 'meditation', 'music']).optional(),
    sort: z.enum(['popular', 'new', 'duration']).default('popular'),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    ageRange: z.enum(['3-5', '6-8', '9-12']).optional(),
    tags: z.union([
      z.string().transform(str => str.split(',')),
      z.array(z.string())
    ]).optional(),
    isFeatured: z.coerce.boolean().optional(),
  }),
});

// Search content validator
const searchContentSchema = z.object({
  query: z.object({
    q: z.string().min(2, 'Search query must be at least 2 characters'),
    type: z.enum(['story', 'affirmation', 'meditation', 'music']).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    offset: z.coerce.number().int().min(0).default(0),
    ageRange: z.enum(['3-5', '6-8', '9-12']).optional(),
    tags: z.union([
      z.string().transform(str => str.split(',')),
      z.array(z.string())
    ]).optional(),
  }),
});

// Home content validator
const homeContentSchema = z.object({
  query: z.object({
    kidId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID').optional(),
  }),
});

// Increment popularity validator
const incrementPopularitySchema = z.object({
  params: z.object({
    slug: z.string().min(1, 'Content slug is required'),
  }),
  body: z.object({
    amount: z.number().int().min(1).max(10).default(1).optional(),
  }),
});

module.exports = {
  contentSlugSchema,
  exploreListSchema,
  searchContentSchema,
  homeContentSchema,
  incrementPopularitySchema,
};
