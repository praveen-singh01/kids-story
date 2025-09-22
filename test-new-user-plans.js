const axios = require('axios');
require('dotenv').config();

// Test configuration
const BACKEND_URL = 'http://localhost:3002/api/v1';
const PAYMENT_MICROSERVICE_URL = 'http://localhost:3000';

async function testNewUserPlanFetch() {
  console.log('🚀 Testing Kids Story Backend - Plan Fetch for New User\n');
  
  try {
    // Step 1: Check if both services are running
    console.log('📡 Step 1: Checking service availability...');
    
    // Check kids-story backend
    try {
      await axios.get(`${BACKEND_URL.replace('/api/v1', '')}/health`);
      console.log('✅ Kids Story Backend is running');
    } catch (error) {
      console.log('❌ Kids Story Backend is not running');
      console.log('   Please start with: npm start');
      return;
    }
    
    // Check payment microservice
    try {
      await axios.get(`${PAYMENT_MICROSERVICE_URL}/api/health`);
      console.log('✅ Payment Microservice is running');
    } catch (error) {
      console.log('❌ Payment Microservice is not running');
      console.log('   Please start the payment microservice');
      return;
    }
    
    // Step 2: Create a new user via Google authentication
    console.log('\n👤 Step 2: Creating new user via Google authentication...');
    
    const uniqueEmail = `test.newuser.${Date.now()}@example.com`;
    const uniqueProviderId = `google_${Date.now()}`;
    
    console.log(`📧 Test user email: ${uniqueEmail}`);
    
    const authResponse = await axios.post(`${BACKEND_URL}/auth/google`, {
      idToken: 'mock_token_for_testing' // This will use fallback user creation in development
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!authResponse.data.success) {
      console.log('❌ Failed to create/authenticate user');
      console.log('Response:', authResponse.data);
      return;
    }

    const user = authResponse.data.data.user;
    const accessToken = authResponse.data.data.accessToken;
    
    console.log('✅ User authenticated successfully');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Is New User: ${!user.lastLoginAt || user.createdAt === user.updatedAt}`);
    
    // Step 3: Fetch subscription plans
    console.log('\n📋 Step 3: Fetching subscription plans...');
    
    const plansResponse = await axios.get(`${BACKEND_URL}/subscriptions/plans`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!plansResponse.data.success) {
      console.log('❌ Failed to fetch plans');
      console.log('Response:', plansResponse.data);
      return;
    }

    const plansData = plansResponse.data.data;
    console.log('✅ Plans fetched successfully');
    
    // Step 4: Analyze the response
    console.log('\n🔍 Step 4: Analyzing plan response...');
    console.log('📊 Full Response:');
    console.log(JSON.stringify(plansResponse.data, null, 2));
    
    console.log('\n📈 Analysis Results:');
    console.log(`🎯 Trial Eligible: ${plansData.trialEligible}`);
    console.log(`📦 Number of Plans: ${plansData.subscriptionList.length}`);
    console.log(`🔑 API Key Present: ${!!plansData.apiKey}`);
    
    // Analyze each plan
    console.log('\n📋 Plan Details:');
    plansData.subscriptionList.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}`);
      console.log(`      - Price: ₹${plan.priceAfterTax} (Base: ₹${plan.price})`);
      console.log(`      - Interval: ${plan.interval}`);
      console.log(`      - Plan Type: ${plan.plan}`);
      console.log(`      - Free Trial: ${plan.freeTrial}`);
      console.log(`      - Trial Price: ₹${plan.trialPrice}`);
      console.log(`      - Features: ${plan.features.length} features`);
      if (plan.savings) {
        console.log(`      - Savings: ${plan.savings}`);
      }
      console.log('');
    });
    
    // Step 5: Validate expected behavior for new user
    console.log('🧪 Step 5: Validating expected behavior...');
    
    let testsPassed = 0;
    let totalTests = 0;
    
    // Test 1: Trial eligibility should be true for new user
    totalTests++;
    if (plansData.trialEligible === true) {
      console.log('✅ Test 1 PASSED: New user is trial eligible');
      testsPassed++;
    } else {
      console.log('❌ Test 1 FAILED: New user should be trial eligible but got false');
    }
    
    // Test 2: Should show only 1 plan (monthly with trial) for trial eligible user
    totalTests++;
    if (plansData.trialEligible && plansData.subscriptionList.length === 1) {
      console.log('✅ Test 2 PASSED: Trial eligible user sees only 1 plan');
      testsPassed++;
    } else if (plansData.trialEligible && plansData.subscriptionList.length !== 1) {
      console.log(`❌ Test 2 FAILED: Trial eligible user should see 1 plan but got ${plansData.subscriptionList.length}`);
    } else {
      console.log('⏭️  Test 2 SKIPPED: User not trial eligible');
    }
    
    // Test 3: Trial plan should have freeTrial: true and trialPrice: 3
    totalTests++;
    if (plansData.trialEligible && plansData.subscriptionList.length > 0) {
      const trialPlan = plansData.subscriptionList[0];
      if (trialPlan.freeTrial === true && trialPlan.trialPrice === 3) {
        console.log('✅ Test 3 PASSED: Trial plan has correct trial settings (freeTrial: true, trialPrice: ₹3)');
        testsPassed++;
      } else {
        console.log(`❌ Test 3 FAILED: Trial plan should have freeTrial: true and trialPrice: 3, but got freeTrial: ${trialPlan.freeTrial}, trialPrice: ${trialPlan.trialPrice}`);
      }
    } else {
      console.log('⏭️  Test 3 SKIPPED: No trial plan available');
    }
    
    // Test 4: API key should be present
    totalTests++;
    if (plansData.apiKey && plansData.apiKey.startsWith('rzp_')) {
      console.log('✅ Test 4 PASSED: Razorpay API key is present and valid format');
      testsPassed++;
    } else {
      console.log('❌ Test 4 FAILED: Razorpay API key missing or invalid format');
    }
    
    // Step 6: Test direct payment microservice call
    console.log('\n🔧 Step 6: Testing direct payment microservice call...');
    
    try {
      const jwt = require('jsonwebtoken');
      const paymentToken = jwt.sign(
        { userId: user.id, appId: 'com.sunostories.app' },
        process.env.PAYMENT_JWT_SECRET || 'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh',
        { expiresIn: '1h' }
      );
      
      const trialCheckResponse = await axios.get(
        `${PAYMENT_MICROSERVICE_URL}/api/payment/trial-eligibility?packageName=com.sunostories.app`,
        {
          headers: {
            'Authorization': `Bearer ${paymentToken}`,
            'x-app-id': 'com.sunostories.app',
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Direct payment microservice call successful');
      console.log('📊 Payment microservice response:');
      console.log(JSON.stringify(trialCheckResponse.data, null, 2));
      
      // Test 5: Payment microservice should return canUseTrial: true
      totalTests++;
      if (trialCheckResponse.data.success && trialCheckResponse.data.data.canUseTrial === true) {
        console.log('✅ Test 5 PASSED: Payment microservice confirms user can use trial');
        testsPassed++;
      } else {
        console.log('❌ Test 5 FAILED: Payment microservice should return canUseTrial: true');
      }
      
    } catch (error) {
      console.log('❌ Direct payment microservice call failed:', error.message);
    }
    
    // Final Results
    console.log('\n🏁 Final Test Results:');
    console.log(`✅ Tests Passed: ${testsPassed}/${totalTests}`);
    console.log(`📊 Success Rate: ${Math.round((testsPassed/totalTests) * 100)}%`);
    
    if (testsPassed === totalTests) {
      console.log('🎉 ALL TESTS PASSED! Kids Story Backend is correctly handling new user plan fetching.');
    } else {
      console.log('⚠️  Some tests failed. Please review the issues above.');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Run the test
testNewUserPlanFetch();
