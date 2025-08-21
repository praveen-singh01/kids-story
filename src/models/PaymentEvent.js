const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'subscription.created',
      'subscription.updated',
      'subscription.cancelled',
      'subscription.renewed',
      'payment.succeeded',
      'payment.failed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ],
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  processed: {
    type: Boolean,
    default: false,
    index: true,
  },
  processedAt: {
    type: Date,
    default: null,
  },
  receivedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  error: {
    type: String,
    default: null,
  },
  retryCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
paymentEventSchema.index({ eventId: 1 }, { unique: true });
paymentEventSchema.index({ userId: 1, type: 1 });
paymentEventSchema.index({ processed: 1, receivedAt: 1 });
paymentEventSchema.index({ type: 1, receivedAt: -1 });

// Static methods
paymentEventSchema.statics.createEvent = async function(eventId, type, userId, data) {
  try {
    const event = new this({
      eventId,
      type,
      userId,
      data,
    });
    return await event.save();
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error - idempotency
      const existingEvent = await this.findOne({ eventId });
      return existingEvent;
    }
    throw error;
  }
};

paymentEventSchema.statics.findUnprocessed = function(limit = 100) {
  return this.find({ processed: false })
    .sort({ receivedAt: 1 })
    .limit(limit);
};

paymentEventSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({ userId }, null, options)
    .sort({ receivedAt: -1 });
};

// Instance methods
paymentEventSchema.methods.markProcessed = function() {
  this.processed = true;
  this.processedAt = new Date();
  this.error = null;
  return this.save();
};

paymentEventSchema.methods.markFailed = function(error) {
  this.processed = false;
  this.error = error;
  this.retryCount += 1;
  return this.save();
};

paymentEventSchema.methods.canRetry = function() {
  return this.retryCount < 3; // Max 3 retries
};

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
