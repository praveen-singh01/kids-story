const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true
  },
  progress: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastPlayedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
progressSchema.index({ userId: 1, lastPlayedAt: -1 });
progressSchema.index({ contentId: 1 });
progressSchema.index({ userId: 1, contentId: 1 }, { unique: true });
progressSchema.index({ userId: 1, completed: 1 });

// Pre-save middleware to auto-set completed status
progressSchema.pre('save', function(next) {
  // Mark as completed if progress is >= 95% of total
  this.completed = (this.progress / this.total) >= 0.95;
  this.lastPlayedAt = new Date();
  next();
});

// Static method to update or create progress
progressSchema.statics.updateProgress = async function(userId, contentId, progressData) {
  const { progress, total } = progressData;
  
  const updatedProgress = await this.findOneAndUpdate(
    { userId, contentId },
    {
      progress,
      total,
      lastPlayedAt: new Date()
    },
    {
      new: true,
      upsert: true,
      runValidators: true
    }
  );
  
  return updatedProgress;
};

// Static method to get continue playing items
progressSchema.statics.getContinuePlayingItems = async function(userId, limit = 10) {
  return this.find({
    userId,
    completed: false,
    progress: { $gt: 0 }
  })
  .populate('contentId', 'title imageUrl durationSec type')
  .sort({ lastPlayedAt: -1 })
  .limit(limit);
};

// Virtual for progress percentage
progressSchema.virtual('progressPercentage').get(function() {
  return Math.round((this.progress / this.total) * 100);
});

module.exports = mongoose.model('Progress', progressSchema);
