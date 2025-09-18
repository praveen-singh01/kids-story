const axios = require('axios');

// Test Google authentication with trial eligibility check
async function testGoogleAuth() {
  try {
    console.log('🧪 Testing Google authentication with trial eligibility...');

    // Test with a mock Google ID token (development mode) - use unique email for new user
    const uniqueEmail = `test.user.${Date.now()}@example.com`;
    const mockToken = Buffer.from(JSON.stringify({
      header: { alg: 'RS256', typ: 'JWT' },
      payload: {
        sub: `google_${Date.now()}`,
        email: uniqueEmail,
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg',
        email_verified: true
      },
      signature: 'mock_signature'
    })).toString('base64');

    const response = await axios.post('http://localhost:3002/api/v1/auth/google', {
      idToken: mockToken
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Authentication successful!');
    console.log('📊 Response data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Check if trial eligibility is included
    const user = response.data.data.user;
    if (user.subscription && user.subscription.isTrialEligible !== undefined) {
      console.log(`🎯 Trial eligibility: ${user.subscription.isTrialEligible}`);
      console.log(`📝 Trial used: ${user.subscription.hasUsedTrial}`);
    } else {
      console.log('⚠️  Trial eligibility information not found in response');
    }

  } catch (error) {
    console.error('❌ Authentication failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Test payment microservice connection
async function testPaymentMicroservice() {
  try {
    console.log('🧪 Testing payment microservice connection...');

    const response = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Payment microservice is running');
    console.log('📊 Health check:', response.data);
  } catch (error) {
    console.error('❌ Payment microservice connection failed:');
    console.error('Message:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting authentication and trial eligibility tests...\n');
  
  await testPaymentMicroservice();
  console.log('');
  await testGoogleAuth();
  
  console.log('\n✨ Tests completed!');
}

runTests();
