const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Import User model
const { User } = require('./src/models');

async function createTestUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test user data
    const testUserData = {
      name: 'Test Kids Story User',
      email: 'test.kids@gumbotech.in',
      phone: '9876543211', // 10 digits starting with 6-9
      provider: 'email', // Required field
      providerId: 'test.kids@gumbotech.in',
      emailVerified: true,
      isActive: true,
      roles: ['user']
    };

    // Check if user already exists
    let existingUser = await User.findOne({ 
      $or: [
        { phone: testUserData.phone },
        { email: testUserData.email }
      ]
    });

    let user;
    if (existingUser) {
      console.log('📱 Test user already exists:', {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email
      });
      user = existingUser;
    } else {
      console.log('👤 Creating new test user...');
      user = await User.create(testUserData);
      console.log('✅ Test user created:', {
        id: user._id,
        name: user.name,
        email: user.email
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Save token to file
    fs.writeFileSync('kids-story-test-jwt-token.txt', token);
    console.log('✅ JWT token saved to kids-story-test-jwt-token.txt');

    console.log('\n🧪 Test cURL Commands:');
    console.log('\n1. Get User Subscription:');
    console.log(`curl -X GET "http://localhost:3002/api/v1/subscriptions/me" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${token}"`);

    console.log('\n2. Create Trial Subscription:');
    console.log(`curl -X POST "http://localhost:3002/api/v1/subscriptions" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -d '{`);
    console.log(`    "planId": "plan_kids_story_trial",`);
    console.log(`    "paymentContext": {`);
    console.log(`      "source": "mobile_app",`);
    console.log(`      "version": "1.0.0"`);
    console.log(`    }`);
    console.log(`  }'`);

    console.log('\n3. Create Monthly Subscription:');
    console.log(`curl -X POST "http://localhost:3002/api/v1/subscriptions" \\`);
    console.log(`  -H "Content-Type: application/json" \\`);
    console.log(`  -H "Authorization: Bearer ${token}" \\`);
    console.log(`  -d '{`);
    console.log(`    "planId": "plan_kids_story_monthly",`);
    console.log(`    "paymentContext": {`);
    console.log(`      "source": "mobile_app",`);
    console.log(`      "version": "1.0.0"`);
    console.log(`    }`);
    console.log(`  }'`);

    console.log('\n📝 User Details:');
    console.log(`User ID: ${user._id}`);
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Phone: ${user.phone}`);

    console.log('\n🎯 Ready for testing! Server should be running on http://localhost:3002');

    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestUser();
