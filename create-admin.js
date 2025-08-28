const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bedtime';

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  provider: {
    type: String,
    enum: ['google', 'local'],
    required: true,
    default: 'local',
  },
  roles: [{
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  }],
  subscription: {
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
  },
  isEmailVerified: {
    type: Boolean,
    default: true, // Set to true for admin
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
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

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully');

    // Admin user credentials
    const adminEmail = 'admin@kidsstory.com';
    const adminPassword = 'admin123456';
    const adminName = 'Admin User';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
      
      // Update to ensure admin role
      if (!existingAdmin.roles.includes('admin')) {
        existingAdmin.roles.push('admin');
        await existingAdmin.save();
        console.log('Added admin role to existing user');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Create new admin user
    const adminUser = new User({
      email: adminEmail,
      name: adminName,
      password: adminPassword,
      provider: 'local',
      roles: ['user', 'admin'], // Include both user and admin roles
      subscription: {
        plan: 'premium',
        status: 'active',
      },
      isEmailVerified: true,
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('');
    console.log('🌐 Admin Dashboard URL: http://localhost:3001');
    console.log('');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdminUser();
