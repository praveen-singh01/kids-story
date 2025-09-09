const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../config/logger');
require('dotenv').config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for admin user creation');

    // Admin user credentials
    const adminEmail = 'admin@kidsstory.com';
    const adminPassword = 'admin123456';
    const adminName = 'Admin User';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👤 Name: ${existingAdmin.name}`);
      console.log(`🛡️  Roles: ${existingAdmin.roles.join(', ')}`);
      return;
    }

    // Create admin user
    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      provider: 'email',
      roles: ['user', 'admin'],
      emailVerified: true,
      isActive: true
    });

    await adminUser.save();

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email: admin@kidsstory.com');
    console.log('🔑 Password: admin123456');
    console.log('👤 Name: Admin User');
    console.log('🛡️  Roles: user, admin');
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    logger.error('Admin user creation failed:', error);
    console.error('❌ Admin user creation failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run admin user creation if this file is executed directly
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };
