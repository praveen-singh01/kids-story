const { z } = require('zod');

// Checkout validator
const checkoutSchema = z.object({
  body: z.object({
    plan: z.enum(['premium', 'family'], {
      errorMap: () => ({ message: 'Plan must be premium or family' }),
    }),
    successUrl: z.string().url('Invalid success URL'),
    cancelUrl: z.string().url('Invalid cancel URL'),
  }),
});

// Payment event validator (for M2M)
const paymentEventSchema = z.object({
  body: z.object({
    eventId: z.string().min(1, 'Event ID is required'),
    type: z.enum([
      'subscription.created',
      'subscription.updated', 
      'subscription.cancelled',
      'subscription.renewed',
      'payment.succeeded',
      'payment.failed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ]),
    userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID'),
    data: z.object({}).passthrough(), // Allow any additional data
  }),
});

module.exports = {
  checkoutSchema,
  paymentEventSchema,
};
