const { z } = require('zod');

// Add favorite validator
const addFavoriteSchema = z.object({
  body: z.object({
    kidId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
    contentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'),
  }),
});

// Remove favorite validator
const removeFavoriteSchema = z.object({
  params: z.object({
    contentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'),
  }),
  query: z.object({
    kidId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
  }),
});

// Get favorites validator
const getFavoritesSchema = z.object({
  query: z.object({
    kidId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

// Bulk add favorites validator
const bulkAddFavoritesSchema = z.object({
  body: z.object({
    kidId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
    contentIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid content ID'))
      .min(1, 'At least one content ID required')
      .max(20, 'Maximum 20 content IDs allowed'),
  }),
});

module.exports = {
  addFavoriteSchema,
  removeFavoriteSchema,
  getFavoritesSchema,
  bulkAddFavoritesSchema,
};
