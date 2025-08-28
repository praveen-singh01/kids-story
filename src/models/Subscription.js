const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // User who owns the subscription
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Payment microservice subscription ID
  paymentSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Razorpay subscription ID
  razorpaySubscriptionId: {
    type: String,
    index: true
  },

  // Plan details
  planId: {
    type: String,
    required: true,
    index: true
  },

  planName: {
    type: String,
    required: true
  },

  planType: {
    type: String,
    enum: ['trial', 'monthly', 'yearly'],
    required: true,
    index: true
  },

  // Subscription amount and billing
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

  billingCycle: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    required: true
  },

  // Subscription status
  status: {
    type: String,
    required: true,
    enum: ['created', 'authenticated', 'active', 'paused', 'halted', 'cancelled', 'completed', 'expired'],
    default: 'created',
    index: true
  },

  // Subscription dates
  startDate: {
    type: Date,
    index: true
  },

  endDate: {
    type: Date,
    index: true
  },

  nextBillingDate: {
    type: Date,
    index: true
  },

  // Trial information
  trialStart: {
    type: Date
  },

  trialEnd: {
    type: Date
  },

  // Payment context from microservice
  paymentContext: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Subscription metadata
  metadata: {
    // Auto-renewal setting
    autoRenewal: {
      type: Boolean,
      default: true
    },

    // Cancellation details
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Additional metadata
    description: String,
    notes: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },

  activatedAt: {
    type: Date,
    index: true
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

// Indexes for better query performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, createdAt: -1 });
subscriptionSchema.index({ paymentSubscriptionId: 1 }, { unique: true });
subscriptionSchema.index({ razorpaySubscriptionId: 1 }, { sparse: true });
subscriptionSchema.index({ planId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });
subscriptionSchema.index({ nextBillingDate: 1, status: 1 });

// Update the updatedAt field before saving
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Transform _id to id for API responses
subscriptionSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && 
         (!this.endDate || this.endDate > new Date());
});

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('isInTrial').get(function() {
  const now = new Date();
  return this.trialStart && this.trialEnd && 
         now >= this.trialStart && now <= this.trialEnd;
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return null;
  const now = new Date();
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance methods
subscriptionSchema.methods.activate = function(startDate, endDate) {
  this.status = 'active';
  this.startDate = startDate || new Date();
  this.endDate = endDate;
  this.activatedAt = new Date();
  return this.save();
};

subscriptionSchema.methods.cancel = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.metadata.cancellationReason = reason;
  this.metadata.cancelledAt = new Date();
  this.metadata.cancelledBy = cancelledBy;
  this.metadata.autoRenewal = false;
  return this.save();
};

subscriptionSchema.methods.pause = function() {
  this.status = 'paused';
  return this.save();
};

subscriptionSchema.methods.resume = function() {
  this.status = 'active';
  return this.save();
};

subscriptionSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

// Static methods
subscriptionSchema.statics.findByPaymentSubscriptionId = function(paymentSubscriptionId) {
  return this.findOne({ paymentSubscriptionId });
};

subscriptionSchema.statics.findByRazorpaySubscriptionId = function(razorpaySubscriptionId) {
  return this.findOne({ razorpaySubscriptionId });
};

subscriptionSchema.statics.findUserSubscriptions = function(userId, options = {}) {
  const { page = 1, limit = 10, status, planType } = options;
  const skip = (page - 1) * limit;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  if (planType) {
    query.planType = planType;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email')
    .lean();
};

subscriptionSchema.statics.findActiveSubscription = function(userId) {
  return this.findOne({
    userId,
    status: 'active',
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gt: new Date() } }
    ]
  });
};

subscriptionSchema.statics.findExpiringSubscriptions = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).populate('userId', 'name email');
};

subscriptionSchema.statics.getSubscriptionStats = function(userId) {
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

module.exports = mongoose.model('Subscription', subscriptionSchema);
