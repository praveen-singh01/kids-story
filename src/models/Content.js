const mongoose = require('mongoose');
const slugify = require('slugify');

const contentMetadataSchema = new mongoose.Schema({
  keyValue: {
    type: String,
    maxlength: 100
  },
  summary: {
    type: String,
    maxlength: 1000
  }
}, { _id: false });

const contentSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['story', 'meditation', 'affirmation', 'sound']
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  durationSec: {
    type: Number,
    required: true,
    min: 1
  },
  ageRange: {
    type: String,
    required: true,
    enum: ['3-5', '6-8', '9-12']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  language: {
    type: String,
    default: 'en',
    maxlength: 5
  },
  region: {
    type: String,
    default: 'US',
    maxlength: 5
  },
  audioUrl: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  popularityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  metadata: {
    type: contentMetadataSchema,
    default: () => ({})
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  favoriteCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.isActive;
      delete ret.viewCount;
      delete ret.favoriteCount;
      return ret;
    }
  }
});

// Indexes
contentSchema.index({ slug: 1 });
contentSchema.index({ type: 1, isActive: 1 });
contentSchema.index({ ageRange: 1, isActive: 1 });
contentSchema.index({ tags: 1, isActive: 1 });
contentSchema.index({ isFeatured: 1, isActive: 1 });
contentSchema.index({ popularityScore: -1, isActive: 1 });
contentSchema.index({ publishedAt: -1, isActive: 1 });
contentSchema.index({ title: 'text', description: 'text' }); // Text search index

// Pre-save middleware to generate slug
contentSchema.pre('save', function(next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Method to increment view count
contentSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to update popularity score based on views and favorites
contentSchema.methods.updatePopularityScore = function() {
  // Simple algorithm: (favorites * 2 + views * 0.1) / 100, capped at 5
  const score = Math.min(5, (this.favoriteCount * 2 + this.viewCount * 0.1) / 100);
  this.popularityScore = Math.round(score * 10) / 10; // Round to 1 decimal
  return this.save();
};

module.exports = mongoose.model('Content', contentSchema);
