const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  src: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['raster', 'svg', 'lottie', 'video']
  },
  bgColorHex: {
    type: String,
    default: '#FFFFFF',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  borderColorHex: {
    type: String,
    default: '#000000',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  selectionColorHex: {
    type: String,
    default: '#673AB7',
    match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  usageCount: {
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
      delete ret.usageCount;
      return ret;
    }
  }
});

// Indexes
avatarSchema.index({ isActive: 1, sortOrder: 1 });
avatarSchema.index({ type: 1, isActive: 1 });

// Method to increment usage count
avatarSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Static method to get active avatars
avatarSchema.statics.getActiveAvatars = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

module.exports = mongoose.model('Avatar', avatarSchema);
