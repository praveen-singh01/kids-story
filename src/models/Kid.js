const mongoose = require('mongoose');

const kidPreferencesSchema = new mongoose.Schema({
  sleepGoals: {
    type: String,
    maxlength: 500
  },
  tags: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const kidSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  ageRange: {
    type: String,
    required: true,
    enum: ['3-5', '6-8', '9-12']
  },
  avatarKey: {
    type: String,
    default: null
  },
  preferences: {
    type: kidPreferencesSchema,
    default: () => ({ tags: [] })
  },
  isActive: {
    type: Boolean,
    default: true
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
kidSchema.index({ userId: 1 });
kidSchema.index({ userId: 1, isActive: 1 });
kidSchema.index({ ageRange: 1 });

// Validate that user doesn't exceed kid profile limit (e.g., 5 kids per user)
kidSchema.pre('save', async function(next) {
  if (this.isNew) {
    const kidCount = await this.constructor.countDocuments({ 
      userId: this.userId, 
      isActive: true 
    });
    
    if (kidCount >= 5) {
      const error = new Error('Maximum number of kid profiles (5) reached');
      error.name = 'ValidationError';
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Kid', kidSchema);
