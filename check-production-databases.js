const axios = require('axios');
const jwt = require('jsonwebtoken');

async function checkProductionDatabases() {
  console.log('🔍 Checking Production Databases for Trial Eligibility Issue\n');
  
  const userId = '68cbf7f573c5a71c766d8607';
  const packageName = 'com.sunostories.app';
  
  // Step 1: Check user in kids-story backend database
  console.log('📊 Step 1: Checking Kids-Story Backend Database');
  console.log('User ID:', userId);
  
  try {
    // Get user details from production backend
    const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGNiZjdmNTczYzVhNzFjNzY2ZDg2MDciLCJpYXQiOjE3NTgxOTc3NDksImV4cCI6MTc1ODI4NDE0OSwiYXVkIjoia2lkcy1zdG9yeS1hcHAiLCJpc3MiOiJraWRzLXN0b3J5LWFwaSJ9.KxuH5N7h0G-lmRO_gxvUk7qFYgACdLbg1Z7IHPnAhqs';
    
    const userResponse = await axios.get('https://milo.netaapp.in/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (userResponse.data.success) {
      const user = userResponse.data.data;
      console.log('✅ User found in kids-story backend database:');
      console.log('   - Email:', user.email);
      console.log('   - Name:', user.name);
      console.log('   - Created:', user.createdAt);
      console.log('   - Updated:', user.updatedAt);
      console.log('   - Is Active:', user.isActive);
      console.log('   - Provider:', user.provider);
      console.log('   - Current Subscription:');
      console.log('     * Plan:', user.subscription?.plan || 'none');
      console.log('     * Status:', user.subscription?.status || 'none');
      console.log('     * Provider:', user.subscription?.provider || 'none');
      
      // Check if user is truly new
      const createdDate = new Date(user.createdAt);
      const updatedDate = new Date(user.updatedAt);
      const isNewUser = Math.abs(updatedDate - createdDate) < 60000; // Within 1 minute
      console.log('   - Is New User:', isNewUser, '(created and updated within 1 minute)');
      
    } else {
      console.log('❌ User not found in kids-story backend database');
    }
    
  } catch (error) {
    console.log('❌ Failed to get user from kids-story backend:');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  // Step 2: Check payment microservice database
  console.log('\n📊 Step 2: Checking Payment Microservice Database');
  
  try {
    // Generate JWT token for payment microservice
    const paymentToken = jwt.sign(
      { userId, appId: packageName },
      'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh', // This might need to be the production secret
      { expiresIn: '1h' }
    );
    
    // Check trial eligibility
    const trialResponse = await axios.get(
      `https://payments.gumbotech.in/api/payment/trial-eligibility?packageName=${packageName}`,
      {
        headers: {
          'Authorization': `Bearer ${paymentToken}`,
          'x-app-id': packageName,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Payment microservice response:');
    console.log('   - Can Use Trial:', trialResponse.data.data.canUseTrial);
    console.log('   - Has Existing Subscription:', trialResponse.data.data.hasExistingSubscription);
    console.log('   - Existing Subscription:', trialResponse.data.data.existingSubscription);
    
    // Check user subscriptions in payment microservice
    try {
      const subscriptionsResponse = await axios.get(
        `https://payments.gumbotech.in/api/payment/user-subscriptions?packageName=${packageName}`,
        {
          headers: {
            'Authorization': `Bearer ${paymentToken}`,
            'x-app-id': packageName,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ User subscriptions in payment microservice:');
      console.log(JSON.stringify(subscriptionsResponse.data, null, 2));
      
    } catch (subError) {
      console.log('⚠️  Could not fetch user subscriptions (endpoint might not exist)');
      console.log('   Error:', subError.message);
    }
    
  } catch (error) {
    console.log('❌ Failed to check payment microservice:');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  
  // Step 3: Test the integration directly
  console.log('\n📊 Step 3: Testing Backend-to-Payment-Microservice Integration');
  
  // Check if the backend is actually calling the payment microservice
  console.log('Testing the subscription plans endpoint again to see backend logs...');
  
  try {
    const plansResponse = await axios.get('https://milo.netaapp.in/api/v1/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGNiZjdmNTczYzVhNzFjNzY2ZDg2MDciLCJpYXQiOjE3NTgxOTc3NDksImV4cCI6MTc1ODI4NDE0OSwiYXVkIjoia2lkcy1zdG9yeS1hcHAiLCJpc3MiOiJraWRzLXN0b3J5LWFwaSJ9.KxuH5N7h0G-lmRO_gxvUk7qFYgACdLbg1Z7IHPnAhqs`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Current plans response:');
    console.log('   - Trial Eligible:', plansResponse.data.data.trialEligible);
    console.log('   - Number of Plans:', plansResponse.data.data.subscriptionList.length);
    console.log('   - Plans:', plansResponse.data.data.subscriptionList.map(p => ({
      name: p.name,
      freeTrial: p.freeTrial,
      trialPrice: p.trialPrice
    })));
    
  } catch (error) {
    console.log('❌ Failed to get plans:', error.message);
  }
  
  // Step 4: Diagnosis
  console.log('\n🔍 Diagnosis:');
  console.log('');
  console.log('If payment microservice shows canUseTrial: true but backend shows trialEligible: false,');
  console.log('then the issue is likely one of these:');
  console.log('');
  console.log('1. ❌ Backend environment variables not updated correctly');
  console.log('   - PAYMENT_MICROSERVICE_URL should be https://payments.gumbotech.in');
  console.log('   - USE_PAYMENT_MICROSERVICE should be "true"');
  console.log('   - PAYMENT_JWT_SECRET should match payment microservice');
  console.log('');
  console.log('2. ❌ Backend not restarted after environment variable changes');
  console.log('');
  console.log('3. ❌ JWT secret mismatch between backend and payment microservice');
  console.log('');
  console.log('4. ❌ Network connectivity issues between backend and payment microservice');
  console.log('');
  console.log('5. ❌ Payment microservice integration code not deployed to production');
  console.log('');
  console.log('Next steps:');
  console.log('- Check production backend logs for payment microservice calls');
  console.log('- Verify environment variables are correctly set');
  console.log('- Ensure backend service was restarted after deployment');
}

checkProductionDatabases().catch(console.error);
