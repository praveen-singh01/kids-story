const axios = require('axios');

// Test complete flow: authenticate new user and fetch plans
async function testTrialFlow() {
  try {
    console.log('🚀 Testing complete trial flow...\n');
    
    // Step 1: Authenticate a new user
    console.log('📝 Step 1: Authenticating new user...');
    const uniqueEmail = `test.trial.${Date.now()}@example.com`;
    
    const authResponse = await axios.post('http://localhost:3002/api/v1/auth/google', {
      idToken: 'mock_token_for_testing'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Authentication successful!');
    const accessToken = authResponse.data.data.accessToken;
    const user = authResponse.data.data.user;
    
    console.log(`👤 User: ${user.email} (ID: ${user.id})`);
    console.log(`🔑 Token: ${accessToken.substring(0, 50)}...`);
    
    // Step 2: Fetch subscription plans
    console.log('\n📋 Step 2: Fetching subscription plans...');
    
    const plansResponse = await axios.get('http://localhost:3002/api/v1/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Plans fetched successfully!');
    console.log('\n📊 Plans Response:');
    console.log(JSON.stringify(plansResponse.data, null, 2));
    
    // Step 3: Analyze the response
    console.log('\n🔍 Analysis:');
    const data = plansResponse.data.data;
    console.log(`🎯 Trial Eligible: ${data.trialEligible}`);
    console.log(`📦 Number of plans: ${data.subscriptionList.length}`);
    
    data.subscriptionList.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name} - ₹${plan.priceAfterTax} (Trial: ${plan.freeTrial ? '₹' + plan.trialPrice : 'No'})`);
    });
    
    // Step 4: Check if trial eligibility is working correctly
    if (data.trialEligible) {
      console.log('\n✅ CORRECT: User is trial eligible');
      if (data.subscriptionList.length === 1 && data.subscriptionList[0].freeTrial) {
        console.log('✅ CORRECT: Only showing trial plan');
      } else {
        console.log('❌ ISSUE: Should only show 1 trial plan, but showing', data.subscriptionList.length, 'plans');
      }
    } else {
      console.log('\n❌ ISSUE: User should be trial eligible but showing as false');
      console.log('🔧 This indicates the payment microservice trial check is failing');
    }

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Test payment microservice directly
async function testPaymentMicroserviceDirectly() {
  try {
    console.log('\n🧪 Testing payment microservice directly...');
    
    // Generate a JWT token for the payment microservice
    const jwt = require('jsonwebtoken');
    const userId = '68cbf3093240f579813609c8'; // Use the original user ID
    const appId = 'com.sunostories.app';
    const secret = 'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh';
    const token = jwt.sign({ userId, appId }, secret, { expiresIn: '1h' });
    
    const response = await axios.get('http://localhost:3000/api/payment/trial-eligibility?packageName=com.sunostories.app', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-app-id': 'com.sunostories.app',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Payment microservice response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Payment microservice test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Run tests
async function runTests() {
  await testTrialFlow();
  await testPaymentMicroserviceDirectly();
  console.log('\n✨ Tests completed!');
}

runTests();
