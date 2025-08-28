const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['story', 'affirmation', 'meditation', 'music'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  durationSec: {
    type: Number,
    required: true,
    min: 1,
    max: 3600, // Max 1 hour
  },
  ageRange: {
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true,
    index: true,
  },
  tags: [{
    type: String,
    enum: ['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'],
    lowercase: true,
  }],
  language: {
    type: String,
    default: 'en',
    lowercase: true,
  },
  region: {
    type: String,
    default: 'US',
    uppercase: true,
  },
  audioUrl: {
    type: String,
    required: true,
    trim: true,
  },
  videoUrl: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    required: true,
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
  },
  mediaMetadata: {
    audioFormat: {
      type: String,
      enum: ['mp3', 'wav', 'aac', 'm4a'],
    },
    videoFormat: {
      type: String,
      enum: ['mp4', 'webm', 'avi', 'mov'],
    },
    thumbnailFormat: {
      type: String,
      enum: ['jpg', 'jpeg', 'png', 'webp'],
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    bitrate: {
      type: Number,
      min: 0,
    },
    resolution: {
      width: Number,
      height: Number,
    },
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    index: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
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

// Compound indexes for efficient queries
contentSchema.index({ categoryId: 1, isActive: 1 });
contentSchema.index({ categoryId: 1, type: 1, ageRange: 1 });
contentSchema.index({ categoryId: 1, isFeatured: -1, popularityScore: -1 });
contentSchema.index({ type: 1, ageRange: 1 });
contentSchema.index({ type: 1, tags: 1 });
contentSchema.index({ type: 1, isFeatured: -1, popularityScore: -1 });
contentSchema.index({ type: 1, publishedAt: -1 });
contentSchema.index({ ageRange: 1, tags: 1 });
contentSchema.index({ isFeatured: -1, popularityScore: -1, publishedAt: -1 });

// Text search index
contentSchema.index({ title: 'text', tags: 'text' });

// Virtual for computed ranking score
contentSchema.virtual('rankingScore').get(function() {
  const featuredBoost = this.isFeatured ? 5 : 0;
  const popularityBoost = Math.log(1 + this.popularityScore);
  const recencyBoost = this.getRecencyBoost();
  
  return featuredBoost + popularityBoost + recencyBoost;
});

// Instance methods
contentSchema.methods.getRecencyBoost = function() {
  const daysSincePublished = (Date.now() - this.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, 2 - (daysSincePublished / 30)); // Boost decreases over 30 days
};

contentSchema.methods.incrementPopularity = function(amount = 1) {
  this.popularityScore += amount;
  return this.save();
};

// Static methods
contentSchema.statics.findByTypeAndAge = function(type, ageRange, options = {}) {
  const query = { type, ageRange, isActive: true };
  return this.find(query, null, options);
};

contentSchema.statics.findRecommended = function(ageRange, tags = [], limit = 10) {
  const query = {
    ageRange,
    isActive: true,
    ...(tags.length > 0 && { tags: { $in: tags } }),
  };
  
  return this.find(query)
    .sort({ isFeatured: -1, popularityScore: -1, publishedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Content', contentSchema);
