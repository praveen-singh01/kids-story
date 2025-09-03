const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
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
  contentType: {
    type: String,
    required: true,
    enum: ['story', 'lesson', 'meditation', 'affirmation', 'sound']
  },
  savedAt: {
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
favoriteSchema.index({ userId: 1, savedAt: -1 });
favoriteSchema.index({ contentId: 1 });
favoriteSchema.index({ userId: 1, contentId: 1 }, { unique: true }); // Prevent duplicate favorites

// Static method to toggle favorite
favoriteSchema.statics.toggleFavorite = async function(userId, contentId, contentType) {
  const existingFavorite = await this.findOne({ userId, contentId });
  
  if (existingFavorite) {
    // Remove favorite
    await this.deleteOne({ _id: existingFavorite._id });
    
    // Decrement favorite count in Content model
    const Content = mongoose.model('Content');
    await Content.findByIdAndUpdate(contentId, { $inc: { favoriteCount: -1 } });
    
    return { action: 'removed', favorite: null };
  } else {
    // Add favorite
    const favorite = await this.create({ userId, contentId, contentType });
    
    // Increment favorite count in Content model
    const Content = mongoose.model('Content');
    await Content.findByIdAndUpdate(contentId, { $inc: { favoriteCount: 1 } });
    
    return { action: 'added', favorite };
  }
};

module.exports = mongoose.model('Favorite', favoriteSchema);
