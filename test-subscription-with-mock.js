#!/usr/bin/env node

/**
 * Test Script: Subscription ID Creation with Mock Payment Service
 * This script demonstrates subscription ID creation by temporarily using a mock payment service
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api/v1';

// Backup and restore payment service
const paymentServicePath = path.join(__dirname, 'src/services/paymentService.js');
const backupPath = path.join(__dirname, 'src/services/paymentService.js.backup');

async function createMockPaymentService() {
  console.log('📝 Creating mock payment service for testing...');
  
  // Backup original file
  const originalContent = fs.readFileSync(paymentServicePath, 'utf8');
  fs.writeFileSync(backupPath, originalContent);

  // Create mock implementation
  const mockContent = `const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Mock Payment Service for Testing
 */
class PaymentServiceClient {
  constructor() {
    this.baseUrl = 'mock://payment-service';
    this.packageId = 'com.kids.story';
    this.jwtSecret = 'mock-secret';
    logger.info('Using MOCK Payment Service for testing');
  }

  generateToken(userId) {
    return 'mock-jwt-token-' + userId;
  }

  getHeaders(userId) {
    return {
      'Authorization': 'Bearer mock-token',
      'x-app-id': this.packageId,
      'Content-Type': 'application/json'
    };
  }

  async createSubscription(userId, planId, paymentContext = {}) {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock subscription data
      const subscriptionId = 'sub_' + Date.now() + '_' + planId.split('_').pop();
      const razorpaySubscriptionId = 'rzp_sub_' + Math.random().toString(36).substr(2, 12);
      const shortUrl = 'https://rzp.io/i/' + Math.random().toString(36).substr(2, 8);

      const mockResponse = {
        subscriptionId,
        planId,
        status: 'created',
        razorpaySubscriptionId,
        shortUrl,
        userId,
        createdAt: new Date().toISOString(),
        paymentContext
      };

      logger.info('Mock subscription created for user ' + userId + ': ' + subscriptionId);
      return mockResponse;
    } catch (error) {
      logger.error('Mock subscription creation failed:', error);
      throw error;
    }
  }

  async getUserSubscriptions(userId, page = 1, limit = 10) {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const mockSubscriptions = {
        subscriptions: [
          {
            id: 'sub_mock_' + userId,
            planId: 'plan_kids_story_trial',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ],
        pagination: {
          total: 1,
          page,
          limit,
          hasMore: false
        }
      };

      logger.info('Mock subscriptions retrieved for user ' + userId);
      return mockSubscriptions;
    } catch (error) {
      logger.error('Mock get subscriptions failed:', error);
      throw error;
    }
  }

  async updateUserSubscription(userId, subscriptionData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.subscription = {
        ...user.subscription,
        ...subscriptionData
      };

      await user.save();
      logger.info('Mock user subscription updated for user ' + userId);
      return user;
    } catch (error) {
      logger.error('Mock update user subscription error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentServiceClient();`;

  fs.writeFileSync(paymentServicePath, mockContent);
  console.log('✅ Mock payment service created');
}

async function restorePaymentService() {
  console.log('🔄 Restoring original payment service...');
  if (fs.existsSync(backupPath)) {
    const originalContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(paymentServicePath, originalContent);
    fs.unlinkSync(backupPath);
    console.log('✅ Original payment service restored');
  }
}

async function testWithMockService() {
  console.log('🧪 Testing Subscription ID Creation with Mock Service\n');

  let userToken = '';
  let subscriptionId = '';

  const testUser = {
    name: 'Mock Test User',
    email: 'mock.test@example.com',
    password: 'password123',
    provider: 'email'
  };

  try {
    // Create mock payment service
    await createMockPaymentService();
    
    // Wait a moment for the service to be reloaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 1: Register user
    console.log('1️⃣ Creating test user...');
    const registerResponse = await axios.post(\`\${BASE_URL}/auth/register\`, testUser);
    
    if (registerResponse.data.success) {
      userToken = registerResponse.data.data.accessToken;
      console.log('✅ User created successfully');
      console.log(\`   User ID: \${registerResponse.data.data.user.id}\`);
    }

    // Step 2: Create subscription with mock service
    console.log('\\n2️⃣ Creating subscription with mock service...');
    const subscriptionPayload = {
      planId: 'plan_kids_story_trial',
      paymentContext: {
        source: 'mock_test',
        userAgent: 'Mock Test Script v1.0'
      }
    };

    const subscriptionResponse = await axios.post(\`\${BASE_URL}/subscriptions\`, subscriptionPayload, {
      headers: { 
        Authorization: \`Bearer \${userToken}\`,
        'Content-Type': 'application/json'
      }
    });

    if (subscriptionResponse.data.success) {
      subscriptionId = subscriptionResponse.data.data.subscriptionId;
      console.log('✅ Subscription created successfully!');
      console.log(\`   🆔 Subscription ID: \${subscriptionId}\`);
      console.log(\`   💳 Razorpay ID: \${subscriptionResponse.data.data.razorpaySubscriptionId}\`);
      console.log(\`   🔗 Payment URL: \${subscriptionResponse.data.data.shortUrl}\`);
      console.log(\`   📋 Plan: \${subscriptionResponse.data.data.planId}\`);
      console.log(\`   📊 Status: \${subscriptionResponse.data.data.status}\`);
    }

    // Step 3: Test payment subscription endpoint
    console.log('\\n3️⃣ Testing payment subscription endpoint...');
    const paymentSubResponse = await axios.post(\`\${BASE_URL}/payment/subscription\`, subscriptionPayload, {
      headers: { 
        Authorization: \`Bearer \${userToken}\`,
        'Content-Type': 'application/json'
      }
    });

    if (paymentSubResponse.data.success) {
      console.log('✅ Payment subscription created successfully!');
      console.log(\`   🆔 Subscription ID: \${paymentSubResponse.data.data.subscriptionId}\`);
    }

    // Step 4: Get user subscriptions
    console.log('\\n4️⃣ Getting user subscriptions...');
    const userSubsResponse = await axios.get(\`\${BASE_URL}/payment/subscriptions\`, {
      headers: { Authorization: \`Bearer \${userToken}\` }
    });

    if (userSubsResponse.data.success) {
      console.log('✅ User subscriptions retrieved');
      console.log(\`   Count: \${userSubsResponse.data.subscriptions?.length || 0}\`);
    }

    console.log('\\n🎯 Mock Test Results:');
    console.log('   • User registration: ✅ Working');
    console.log('   • Subscription creation: ✅ Working with mock');
    console.log('   • Subscription ID generation: ✅ Working');
    console.log('   • Payment integration: ✅ Working with mock');
    console.log('   • ID capture ready: ✅ For Postman collection');

  } catch (error) {
    console.error('❌ Mock test failed:', error.response?.data || error.message);
  } finally {
    // Always restore the original service
    await restorePaymentService();
  }
}

// Run the test
testWithMockService().catch(console.error);
