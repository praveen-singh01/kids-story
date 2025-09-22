const axios = require('axios');
const jwt = require('jsonwebtoken');

async function verifyProductionFix() {
  console.log('🔍 Verifying Production Payment Microservice Integration\n');
  
  const userId = '68cbf7f573c5a71c766d8607';
  const packageName = 'com.sunostories.app';
  
  // Test the correct payment microservice URL
  console.log('📡 Testing correct payment microservice URL...');
  console.log('URL: https://payments.gumbotech.in');
  
  try {
    // Generate JWT token for payment microservice
    const paymentToken = jwt.sign(
      { userId, appId: packageName },
      'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh', // This might need to be the production secret
      { expiresIn: '1h' }
    );
    
    // Test trial eligibility
    const response = await axios.get(
      `https://payments.gumbotech.in/api/payment/trial-eligibility?packageName=${packageName}`,
      {
        headers: {
          'Authorization': `Bearer ${paymentToken}`,
          'x-app-id': packageName,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Payment microservice is accessible and working');
    console.log('📊 Trial eligibility response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.canUseTrial) {
      console.log('\n🎉 CONFIRMED: User should be trial eligible!');
      console.log('   - canUseTrial:', response.data.data.canUseTrial);
      console.log('   - hasExistingSubscription:', response.data.data.hasExistingSubscription);
    } else {
      console.log('\n❌ Unexpected response from payment microservice');
    }
    
  } catch (error) {
    console.log('❌ Payment microservice test failed:');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  // Show the fix needed
  console.log('\n🔧 SOLUTION REQUIRED:');
  console.log('');
  console.log('Update the production environment variable:');
  console.log('');
  console.log('❌ Current (wrong):');
  console.log('   PAYMENT_MICROSERVICE_URL=https://payment.gumbotech.in');
  console.log('');
  console.log('✅ Should be (correct):');
  console.log('   PAYMENT_MICROSERVICE_URL=https://payments.gumbotech.in');
  console.log('');
  console.log('After this fix, the production response should show:');
  console.log('   - trialEligible: true');
  console.log('   - subscriptionList: [1 plan with freeTrial: true, trialPrice: 3]');
  
  // Test what the production backend should return after the fix
  console.log('\n📋 Expected Production Response After Fix:');
  console.log(JSON.stringify({
    "success": true,
    "data": {
      "subscriptionList": [
        {
          "id": "plan_RAeTVEtz6dFtPY",
          "name": "Monthly Plan",
          "price": 99,
          "priceAfterTax": 117,
          "currency": "INR",
          "interval": "month",
          "validityInDays": 30,
          "plan": "monthly",
          "features": [
            "Access to all stories",
            "Full content library",
            "High-quality audio",
            "Offline downloads",
            "Ad-free experience",
            "New content weekly"
          ],
          "freeTrial": true,
          "trialPrice": 3
        }
      ],
      "trialEligible": true,
      "apiKey": "rzp_live_EWIcFTdUd0CymA"
    },
    "message": "Subscription plans retrieved successfully"
  }, null, 2));
}

verifyProductionFix().catch(console.error);
