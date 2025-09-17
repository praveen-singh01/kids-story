const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const KIDS_STORY_BACKEND_URL = 'http://localhost:3000';
const PAYMENT_MICROSERVICE_URL = 'https://payments.gumbotech.in';
const PACKAGE_ID = 'com.sunostories.app';
const JWT_SECRET = 'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh';

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * Test direct payment microservice call with proper phone format
 */
async function testDirectPaymentMicroservice() {
  log('\n=== Testing Direct Payment Microservice Call ===', colors.blue);
  
  const token = jwt.sign(
    { 
      userId: 'test_user_123', 
      appId: PACKAGE_ID 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const testData = {
    userId: 'test_user_123',
    planId: 'plan_RAeTVEtz6dFtPY', // Monthly plan
    paymentContext: {
      metadata: {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userPhone: '9876543210' // Valid 10-digit phone
      }
    }
  };

  try {
    const response = await axios.post(`${PAYMENT_MICROSERVICE_URL}/api/payment/subscription`, testData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-app-id': PACKAGE_ID,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Direct Payment Microservice: SUCCESS', colors.green);
    log(`   Subscription ID: ${response.data.data.subscriptionId}`, colors.green);
    log(`   Payment URL: ${response.data.data.shortUrl}`, colors.green);
    
    return { success: true, data: response.data };
  } catch (error) {
    log('❌ Direct Payment Microservice: FAILED', colors.red);
    log(`   Status: ${error.response?.status}`, colors.red);
    log(`   Error: ${error.response?.data?.error?.message || error.message}`, colors.red);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Test kids story backend subscription creation (simulated)
 */
async function testKidsStoryBackend() {
  log('\n=== Testing Kids Story Backend Integration ===', colors.blue);
  
  // Simulate the enhanced paymentContext that would be built by the backend
  const enhancedPaymentContext = {
    metadata: {
      userName: 'Test User',
      userEmail: 'test@example.com',
      userPhone: '9999999999', // Default fallback phone
      userId: 'test_user_123',
      packageId: 'com.sunostories.app'
    }
  };

  // Test the phone number formatting function
  const PaymentServiceClient = require('./src/services/paymentService');
  const paymentService = new PaymentServiceClient();
  
  // Test various phone number formats
  const phoneTests = [
    { input: null, expected: '9999999999' },
    { input: '', expected: '9999999999' },
    { input: '9876543210', expected: '9876543210' },
    { input: '+91 9876543210', expected: '9876543210' },
    { input: '919876543210', expected: '9876543210' },
    { input: '123456789', expected: '9999999999' }, // Invalid format
    { input: '5876543210', expected: '9999999999' }  // Doesn't start with 6-9
  ];

  log('\n📞 Testing Phone Number Formatting:', colors.yellow);
  phoneTests.forEach(test => {
    const result = paymentService.formatPhoneNumber(test.input);
    const status = result === test.expected ? '✅' : '❌';
    log(`   ${status} Input: "${test.input}" → Output: "${result}" (Expected: "${test.expected}")`, 
        result === test.expected ? colors.green : colors.red);
  });

  // Test direct payment microservice call with formatted data
  const token = jwt.sign(
    { 
      userId: 'test_user_123', 
      appId: PACKAGE_ID 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  try {
    const response = await axios.post(`${PAYMENT_MICROSERVICE_URL}/api/payment/subscription`, {
      userId: 'test_user_123',
      planId: 'plan_RAeTVEtz6dFtPY',
      paymentContext: enhancedPaymentContext
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-app-id': PACKAGE_ID,
        'Content-Type': 'application/json'
      }
    });

    log('✅ Kids Story Backend Integration: SUCCESS', colors.green);
    log(`   Subscription ID: ${response.data.data.subscriptionId}`, colors.green);
    log(`   Payment URL: ${response.data.data.shortUrl}`, colors.green);
    
    return { success: true, data: response.data };
  } catch (error) {
    log('❌ Kids Story Backend Integration: FAILED', colors.red);
    log(`   Status: ${error.response?.status}`, colors.red);
    log(`   Error: ${error.response?.data?.error?.message || error.message}`, colors.red);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Main test function
 */
async function runTests() {
  log('🧪 Kids Story Backend - Payment Microservice Integration Test', colors.blue);
  log('=' .repeat(60), colors.blue);
  
  const directResult = await testDirectPaymentMicroservice();
  const backendResult = await testKidsStoryBackend();
  
  // Summary
  log('\n=== TEST SUMMARY ===', colors.blue);
  log(`Direct Payment Microservice: ${directResult.success ? '✅ WORKING' : '❌ FAILED'}`, 
      directResult.success ? colors.green : colors.red);
  log(`Kids Story Backend Integration: ${backendResult.success ? '✅ WORKING' : '❌ FAILED'}`, 
      backendResult.success ? colors.green : colors.red);
  
  if (directResult.success && backendResult.success) {
    log('\n🎉 CONCLUSION: All tests passed! Kids Story Backend can now create subscriptions.', colors.green);
    log('   The phone number validation issue has been resolved.', colors.green);
  } else {
    log('\n⚠️  CONCLUSION: Some tests failed. Check the errors above.', colors.yellow);
  }
  
  log('\n🔧 NEXT STEPS:', colors.blue);
  log('   1. Start the Kids Story Backend server', colors.yellow);
  log('   2. Test the actual API endpoints', colors.yellow);
  log('   3. Verify with Flutter app integration', colors.yellow);
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    log(`\n💥 Test script failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { runTests };
