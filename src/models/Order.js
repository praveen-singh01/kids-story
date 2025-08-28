const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // User who placed the order
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Payment microservice order ID
  paymentOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Razorpay order ID
  razorpayOrderId: {
    type: String,
    index: true
  },

  // Razorpay payment ID (after successful payment)
  razorpayPaymentId: {
    type: String,
    index: true
  },

  // Order details
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },

  // Order status
  status: {
    type: String,
    required: true,
    enum: ['created', 'attempted', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'created',
    index: true
  },

  // Payment context from microservice
  paymentContext: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Order metadata
  metadata: {
    // What the order is for
    orderType: {
      type: String,
      enum: ['content_purchase', 'subscription', 'premium_access', 'other'],
      default: 'other'
    },

    // Related content or subscription
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },

    // Additional metadata
    description: String,
    notes: String
  },

  // Payment timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  paidAt: {
    type: Date,
    index: true
  },

  failedAt: {
    type: Date,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// Indexes for better query performance
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ paymentOrderId: 1 }, { unique: true });
orderSchema.index({ razorpayOrderId: 1 }, { sparse: true });
orderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transform _id to id for API responses
orderSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Instance methods
orderSchema.methods.markAsPaid = function(razorpayPaymentId) {
  this.status = 'paid';
  this.razorpayPaymentId = razorpayPaymentId;
  this.paidAt = new Date();
  return this.save();
};

orderSchema.methods.markAsFailed = function() {
  this.status = 'failed';
  this.failedAt = new Date();
  return this.save();
};

orderSchema.methods.markAsCancelled = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static methods
orderSchema.statics.findByPaymentOrderId = function(paymentOrderId) {
  return this.findOne({ paymentOrderId });
};

orderSchema.statics.findByRazorpayOrderId = function(razorpayOrderId) {
  return this.findOne({ razorpayOrderId });
};

orderSchema.statics.findUserOrders = function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

orderSchema.statics.getOrderStats = function(userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Order', orderSchema);
