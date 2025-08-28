const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    unique: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  contentCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  sortOrder: {
    type: Number,
    default: 0,
    index: true,
  },
  metadata: {
    color: {
      type: String,
      default: '#6366f1',
      match: /^#[0-9A-F]{6}$/i,
    },
    icon: {
      type: String,
      default: 'folder',
      trim: true,
    },
    imageUrl: {
      type: String,
      trim: true,
    },
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

// Indexes for efficient queries
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ isActive: 1, name: 1 });
categorySchema.index({ slug: 1 }, { unique: true });

// Text search index
categorySchema.index({ name: 'text', description: 'text' });

// Virtual for active content count
categorySchema.virtual('activeContentCount', {
  ref: 'Content',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
  match: { isActive: true },
});

// Instance methods
categorySchema.methods.incrementContentCount = function(amount = 1) {
  this.contentCount += amount;
  return this.save();
};

categorySchema.methods.decrementContentCount = function(amount = 1) {
  this.contentCount = Math.max(0, this.contentCount - amount);
  return this.save();
};

// Static methods
categorySchema.statics.findActive = function(options = {}) {
  const query = { isActive: true };
  return this.find(query, null, { sort: { sortOrder: 1, name: 1 }, ...options });
};

categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

categorySchema.statics.updateContentCounts = async function() {
  const Content = mongoose.model('Content');
  const categories = await this.find({});
  
  for (const category of categories) {
    const count = await Content.countDocuments({ 
      categoryId: category._id, 
      isActive: true 
    });
    category.contentCount = count;
    await category.save();
  }
  
  return categories;
};

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Pre-remove middleware to prevent deletion if category has content
categorySchema.pre('remove', async function(next) {
  const Content = mongoose.model('Content');
  const contentCount = await Content.countDocuments({ 
    categoryId: this._id, 
    isActive: true 
  });
  
  if (contentCount > 0) {
    const error = new Error(`Cannot delete category with ${contentCount} active content items`);
    error.code = 'CATEGORY_HAS_CONTENT';
    return next(error);
  }
  
  next();
});

// Transform _id to id for API responses
categorySchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Category', categorySchema);
