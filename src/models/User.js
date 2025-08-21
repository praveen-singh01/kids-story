const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'premium', 'family'],
    default: 'free',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'active',
  },
  currentPeriodEnd: {
    type: Date,
    default: null,
  },
  provider: {
    type: String,
    enum: ['stripe', 'apple', 'google'],
    default: null,
  },
  providerRef: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  name: {
    type: String,
    trim: true,
    default: null,
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'local';
    },
    minlength: 6,
  },
  provider: {
    type: String,
    enum: ['google', 'local'],
    required: true,
    default: 'local',
  },
  googleId: {
    type: String,
    sparse: true,
    index: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: {
    type: String,
    default: null,
  },
  passwordResetToken: {
    type: String,
    default: null,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
  },
  roles: [{
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  }],
  subscription: {
    type: subscriptionSchema,
    default: () => ({}),
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.googleId; // Don't expose in API
      return ret;
    },
  },
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ provider: 1, googleId: 1 });
userSchema.index({ 'subscription.status': 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified and user is local provider
  if (!this.isModified('password') || this.provider !== 'local') {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.provider !== 'local' || !this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = null;
  this.passwordResetExpires = null;
};

userSchema.methods.isAdmin = function() {
  return this.roles.includes('admin');
};

userSchema.methods.hasPremium = function() {
  return this.subscription.plan !== 'free' && this.subscription.status === 'active';
};

userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
