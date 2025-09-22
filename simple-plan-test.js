const axios = require('axios');
require('dotenv').config();

console.log('🚀 Simple Plan Test for New User\n');

async function runTest() {
  try {
    // Step 1: Check backend health
    console.log('📡 Checking backend health...');
    const healthResponse = await axios.get('http://localhost:3002/api/v1/health');
    console.log('✅ Backend is healthy:', healthResponse.data.data.status);
    
    // Step 2: Check payment microservice health
    console.log('\n📡 Checking payment microservice health...');
    const paymentHealthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Payment microservice is healthy:', paymentHealthResponse.data.message);
    
    // Step 3: Authenticate a user (using fallback)
    console.log('\n👤 Authenticating user...');
    const authResponse = await axios.post('http://localhost:3002/api/v1/auth/google', {
      idToken: 'mock_token_for_testing'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!authResponse.data.success) {
      console.log('❌ Authentication failed');
      return;
    }
    
    const user = authResponse.data.data.user;
    const accessToken = authResponse.data.data.accessToken;
    
    console.log('✅ User authenticated:');
    console.log(`   Email: ${user.email}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Step 4: Fetch subscription plans
    console.log('\n📋 Fetching subscription plans...');
    const plansResponse = await axios.get('http://localhost:3002/api/v1/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!plansResponse.data.success) {
      console.log('❌ Plans fetch failed');
      console.log('Response:', plansResponse.data);
      return;
    }
    
    const plansData = plansResponse.data.data;
    console.log('✅ Plans fetched successfully!');
    
    // Step 5: Analyze results
    console.log('\n🔍 Analysis:');
    console.log(`🎯 Trial Eligible: ${plansData.trialEligible}`);
    console.log(`📦 Number of Plans: ${plansData.subscriptionList.length}`);
    
    plansData.subscriptionList.forEach((plan, index) => {
      console.log(`\n   Plan ${index + 1}: ${plan.name}`);
      console.log(`   - Price: ₹${plan.priceAfterTax}`);
      console.log(`   - Free Trial: ${plan.freeTrial}`);
      console.log(`   - Trial Price: ₹${plan.trialPrice}`);
    });
    
    // Step 6: Validation
    console.log('\n✅ Test Results:');
    if (plansData.trialEligible) {
      console.log('✅ User is trial eligible (correct for new user)');
      if (plansData.subscriptionList.length === 1) {
        console.log('✅ Showing only 1 plan (correct for trial eligible user)');
        const plan = plansData.subscriptionList[0];
        if (plan.freeTrial && plan.trialPrice === 3) {
          console.log('✅ Trial plan has correct settings (freeTrial: true, trialPrice: ₹3)');
        } else {
          console.log('❌ Trial plan settings incorrect');
        }
      } else {
        console.log(`❌ Should show 1 plan but showing ${plansData.subscriptionList.length}`);
      }
    } else {
      console.log('❌ User should be trial eligible but showing false');
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

runTest();
