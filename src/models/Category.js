const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  imageUrl: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  contentCount: {
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
      delete ret.contentCount;
      return ret;
    }
  }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1, isActive: 1 });
categorySchema.index({ sortOrder: 1, isActive: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });

// Pre-save middleware to generate slug
categorySchema.pre('save', function(next) {
  if ((this.isModified('name') || this.isNew) && this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
  match: { isActive: true }
});

// Method to get category hierarchy
categorySchema.methods.getHierarchy = async function() {
  const hierarchy = [this];
  let current = this;
  
  while (current.parentId) {
    current = await this.constructor.findById(current.parentId);
    if (current) {
      hierarchy.unshift(current);
    } else {
      break;
    }
  }
  
  return hierarchy;
};

module.exports = mongoose.model('Category', categorySchema);
