const { z } = require('zod');

// Create kid validator
const createKidSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
    ageRange: z.enum(['3-5', '6-8', '9-12'], {
      errorMap: () => ({ message: 'Age range must be 3-5, 6-8, or 9-12' }),
    }),
    avatarKey: z.string().max(100).optional(),
  }),
});

// Update kid validator
const updateKidSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    ageRange: z.enum(['3-5', '6-8', '9-12']).optional(),
    avatarKey: z.string().max(100).optional(),
  }),
});

// Kid ID param validator
const kidIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
  }),
});

// Update preferences validator
const updatePreferencesSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid kid ID'),
  }),
  body: z.object({
    sleepGoals: z.array(z.string().min(1).max(200)).max(10).optional(),
    tags: z.array(z.enum([
      'folk_tales', 'affirmations', 'meditations', 'music',
      'adventure', 'fantasy', 'educational', 'calming'
    ])).max(10).optional(),
  }),
});

module.exports = {
  createKidSchema,
  updateKidSchema,
  kidIdSchema,
  updatePreferencesSchema,
};
