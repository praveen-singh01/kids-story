const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    enum: ['free', 'monthly', 'yearly', 'premium'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled'],
    default: 'active'
  },
  currentPeriodEnd: {
    type: Date,
    default: null
  },
  provider: {
    type: String,
    enum: ['stripe', 'razorpay'],
    default: null
  },
  providerRef: {
    type: String,
    default: null
  },
  trialUsed: {
    type: Boolean,
    default: false
  },
  trialEndDate: {
    type: Date,
    default: null
  },
  razorpaySubscriptionId: {
    type: String,
    default: null
  },
  razorpayCustomerId: {
    type: String,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: null
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  password: {
    type: String,
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  provider: {
    type: String,
    enum: ['google', 'email'],
    required: true
  },
  providerId: {
    type: String,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  roles: [{
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }],
  subscription: {
    type: subscriptionSchema,
    default: () => ({})
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  phone: {
    type: String,
    sparse: true, // Allow null values but ensure uniqueness when present
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number (10 digits starting with 6-9)']
  },
  // Onboarding fields
  fullName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  birthDate: {
    day: {
      type: Number,
      min: 1,
      max: 31
    },
    month: {
      type: Number,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear()
    }
  },
  isOnboarded: {
    type: Boolean,
    default: false
  },
  // User preferences
  preferences: {
    language: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en'
    }
  },
  // Avatar selection
  avatarId: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      delete ret.emailVerificationToken;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      return ret;
    }
  }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ providerId: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ emailVerificationToken: 1 });
userSchema.index({ passwordResetToken: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
