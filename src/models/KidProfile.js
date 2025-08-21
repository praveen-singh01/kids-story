const mongoose = require('mongoose');

const preferencesSchema = new mongoose.Schema({
  sleepGoals: [{
    type: String,
    trim: true,
  }],
  tags: [{
    type: String,
    enum: ['folk_tales', 'affirmations', 'meditations', 'music', 'adventure', 'fantasy', 'educational', 'calming'],
    lowercase: true,
  }],
}, { _id: false });

const kidProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  avatarKey: {
    type: String,
    trim: true,
    default: 'default-avatar',
  },
  ageRange: {
    type: String,
    enum: ['3-5', '6-8', '9-12'],
    required: true,
  },
  preferences: {
    type: preferencesSchema,
    default: () => ({ sleepGoals: [], tags: [] }),
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

// Indexes
kidProfileSchema.index({ userId: 1 });
kidProfileSchema.index({ userId: 1, name: 1 });
kidProfileSchema.index({ ageRange: 1 });
kidProfileSchema.index({ 'preferences.tags': 1 });

// Validation
kidProfileSchema.pre('save', function(next) {
  // Limit number of kids per user (business rule)
  if (this.isNew) {
    this.constructor.countDocuments({ userId: this.userId })
      .then(count => {
        if (count >= 5) { // Max 5 kids per user
          next(new Error('Maximum number of kid profiles reached'));
        } else {
          next();
        }
      })
      .catch(next);
  } else {
    next();
  }
});

// Instance methods
kidProfileSchema.methods.updatePreferences = function(sleepGoals, tags) {
  this.preferences.sleepGoals = sleepGoals || [];
  this.preferences.tags = tags || [];
  return this.save();
};

module.exports = mongoose.model('KidProfile', kidProfileSchema);
