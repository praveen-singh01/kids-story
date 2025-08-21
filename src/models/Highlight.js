const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  subtitle: {
    type: String,
    trim: true,
    maxlength: 200,
    default: '',
  },
  contentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: true,
  }],
  startsAt: {
    type: Date,
    required: true,
    index: true,
  },
  endsAt: {
    type: Date,
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
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

// Indexes
highlightSchema.index({ startsAt: 1, endsAt: 1 });
highlightSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });
highlightSchema.index({ priority: -1, startsAt: 1 });

// Validation
highlightSchema.pre('save', function(next) {
  if (this.startsAt >= this.endsAt) {
    next(new Error('startsAt must be before endsAt'));
  } else {
    next();
  }
});

// Static methods
highlightSchema.statics.findCurrent = function(date = new Date()) {
  return this.find({
    isActive: true,
    startsAt: { $lte: date },
    endsAt: { $gte: date },
  })
  .sort({ priority: -1, startsAt: 1 })
  .populate('contentIds');
};

highlightSchema.statics.findUpcoming = function(date = new Date(), limit = 5) {
  return this.find({
    isActive: true,
    startsAt: { $gt: date },
  })
  .sort({ startsAt: 1 })
  .limit(limit)
  .populate('contentIds');
};

// Instance methods
highlightSchema.methods.isCurrentlyActive = function(date = new Date()) {
  return this.isActive && this.startsAt <= date && this.endsAt >= date;
};

module.exports = mongoose.model('Highlight', highlightSchema);
