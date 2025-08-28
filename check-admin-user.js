require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./src/config');
const { User } = require('./src/models');

async function checkAdminUser() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Admin user found:');
    console.log('Email:', adminUser.email);
    console.log('Name:', adminUser.name);
    console.log('Roles:', adminUser.roles);
    console.log('Email Verified:', adminUser.isEmailVerified);
    console.log('Created:', adminUser.createdAt);
    
    // Test password
    const testPassword = 'admin123';
    const isValidPassword = await bcrypt.compare(testPassword, adminUser.password);
    console.log('Password test (admin123):', isValidPassword ? '✅ Valid' : '❌ Invalid');
    
    if (!isValidPassword) {
      console.log('🔧 Fixing password...');
      const hashedPassword = await bcrypt.hash(testPassword, 12);
      adminUser.password = hashedPassword;
      await adminUser.save();
      console.log('✅ Password updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  }
}

checkAdminUser();
