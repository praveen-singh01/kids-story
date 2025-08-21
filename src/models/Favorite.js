const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  kidId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KidProfile',
    required: true,
    index: true,
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
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

// Unique compound index to prevent duplicate favorites
favoriteSchema.index({ kidId: 1, contentId: 1 }, { unique: true });

// Additional indexes for efficient queries
favoriteSchema.index({ userId: 1, kidId: 1 });
favoriteSchema.index({ contentId: 1 });

// Validation
favoriteSchema.pre('save', async function(next) {
  try {
    // Verify that the kid belongs to the user
    const KidProfile = mongoose.model('KidProfile');
    const kid = await KidProfile.findOne({ _id: this.kidId, userId: this.userId });
    
    if (!kid) {
      next(new Error('Kid profile does not belong to this user'));
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});

// Static methods
favoriteSchema.statics.findByKid = function(kidId, options = {}) {
  return this.find({ kidId }, null, options)
    .populate('contentId')
    .sort({ createdAt: -1 });
};

favoriteSchema.statics.findByUser = function(userId, options = {}) {
  return this.find({ userId }, null, options)
    .populate(['kidId', 'contentId'])
    .sort({ createdAt: -1 });
};

favoriteSchema.statics.addFavorite = async function(userId, kidId, contentId) {
  try {
    const favorite = new this({ userId, kidId, contentId });
    return await favorite.save();
  } catch (error) {
    if (error.code === 11000) { // Duplicate key error
      throw new Error('Content is already in favorites for this kid');
    }
    throw error;
  }
};

favoriteSchema.statics.removeFavorite = function(kidId, contentId) {
  return this.findOneAndDelete({ kidId, contentId });
};

favoriteSchema.statics.isFavorite = async function(kidId, contentId) {
  const favorite = await this.findOne({ kidId, contentId });
  return !!favorite;
};

module.exports = mongoose.model('Favorite', favoriteSchema);
