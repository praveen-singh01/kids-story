/**
 * Test script to create an admin user and test the admin dashboard
 */

const axios = require('axios');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Load models
require('./src/models');

const API_BASE = 'http://localhost:3000/api/v1';
const MONGO_URI = 'mongodb://localhost:27017/bedtime';

// Admin user credentials
const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Admin User'
};

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function createAdminUser() {
  try {
    const User = mongoose.model('User');
    
    // Check if admin user already exists
    const existingUser = await User.findOne({ email: ADMIN_USER.email });
    if (existingUser) {
      console.log('✅ Admin user already exists');
      
      // Update to ensure admin role
      if (!existingUser.roles.includes('admin')) {
        existingUser.roles.push('admin');
        await existingUser.save();
        console.log('✅ Added admin role to existing user');
      }
      
      return true;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 12);
    
    // Create admin user
    const adminUser = new User({
      email: ADMIN_USER.email,
      password: hashedPassword,
      name: ADMIN_USER.name,
      provider: 'local',
      roles: ['admin'],
      isEmailVerified: true,
      subscription: {
        plan: 'premium',
        status: 'active'
      }
    });
    
    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('   Email:', ADMIN_USER.email);
    console.log('   Password:', ADMIN_USER.password);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    return false;
  }
}

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: ADMIN_USER.email,
      password: ADMIN_USER.password
    });
    
    if (response.data.success && response.data.data.user.roles.includes('admin')) {
      console.log('✅ Admin login successful');
      console.log('   User:', response.data.data.user.name);
      console.log('   Roles:', response.data.data.user.roles);
      console.log('   Token:', response.data.data.accessToken.substring(0, 20) + '...');
      return response.data.data.accessToken;
    } else {
      throw new Error('Login failed or user is not admin');
    }
  } catch (error) {
    console.error('❌ Admin login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testContentAPI(token) {
  try {
    console.log('📚 Testing content API...');
    
    const response = await axios.get(`${API_BASE}/explore/list`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    
    if (response.data.success) {
      console.log('✅ Content API working');
      console.log('   Total content:', response.data.data.pagination.total);
      console.log('   Content loaded:', response.data.data.content.length);
      
      // Show content breakdown
      const contentByType = response.data.data.content.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});
      
      console.log('   Content breakdown:', contentByType);
      return true;
    } else {
      throw new Error(response.data.message || 'Content API failed');
    }
  } catch (error) {
    console.error('❌ Content API failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Dashboard Setup and Tests\n');
  
  // Connect to database
  const dbConnected = await connectToDatabase();
  if (!dbConnected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  // Create admin user
  console.log('');
  const adminCreated = await createAdminUser();
  if (!adminCreated) {
    console.log('\n❌ Cannot proceed without admin user');
    process.exit(1);
  }
  
  // Test admin login
  console.log('');
  const token = await testAdminLogin();
  
  // Test content API
  console.log('');
  await testContentAPI(token);
  
  console.log('\n🎉 Admin Dashboard Setup Complete!');
  console.log('\nNext steps:');
  console.log('1. Open the test dashboard: file:///Users/praveensingh/kids-story/admin/test-dashboard.html');
  console.log('2. The dashboard should load content from the API');
  console.log('3. Admin credentials:');
  console.log('   Email: admin@example.com');
  console.log('   Password: admin123');
  
  // Close database connection
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the tests
runTests().catch(console.error);
