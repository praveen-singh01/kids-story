const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testProductionIntegration() {
  console.log('🔍 Testing Production Backend-Payment Microservice Integration\n');
  
  const userId = '68cbf7f573c5a71c766d8607';
  const packageName = 'com.sunostories.app';
  
  // Test 1: Direct payment microservice call (should work)
  console.log('📡 Test 1: Direct Payment Microservice Call');
  try {
    const paymentToken = jwt.sign(
      { userId, appId: packageName },
      'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh',
      { expiresIn: '1h' }
    );
    
    const directResponse = await axios.get(
      `https://payments.gumbotech.in/api/payment/trial-eligibility?packageName=${packageName}`,
      {
        headers: {
          'Authorization': `Bearer ${paymentToken}`,
          'x-app-id': packageName,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Direct payment microservice call works:');
    console.log('   canUseTrial:', directResponse.data.data.canUseTrial);
    console.log('   hasExistingSubscription:', directResponse.data.data.hasExistingSubscription);
    
  } catch (error) {
    console.log('❌ Direct payment microservice call failed:', error.message);
    return;
  }
  
  // Test 2: Backend plans call (currently broken)
  console.log('\n📡 Test 2: Backend Plans Call');
  try {
    const backendResponse = await axios.get('https://milo.netaapp.in/api/v1/subscriptions/plans', {
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGNiZjdmNTczYzVhNzFjNzY2ZDg2MDciLCJpYXQiOjE3NTgxOTc3NDksImV4cCI6MTc1ODI4NDE0OSwiYXVkIjoia2lkcy1zdG9yeS1hcHAiLCJpc3MiOiJraWRzLXN0b3J5LWFwaSJ9.KxuH5N7h0G-lmRO_gxvUk7qFYgACdLbg1Z7IHPnAhqs`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 Backend plans response:');
    console.log('   trialEligible:', backendResponse.data.data.trialEligible);
    console.log('   plans count:', backendResponse.data.data.subscriptionList.length);
    
  } catch (error) {
    console.log('❌ Backend plans call failed:', error.message);
  }
  
  // Test 3: Check if backend can reach payment microservice
  console.log('\n📡 Test 3: Testing Backend-to-Payment Connectivity');
  
  // The issue is likely one of these:
  console.log('🔍 Possible Issues:');
  console.log('');
  console.log('1. Environment Variables Not Set Correctly:');
  console.log('   - Check if USE_PAYMENT_MICROSERVICE=true in production');
  console.log('   - Check if PAYMENT_MICROSERVICE_URL=https://payments.gumbotech.in');
  console.log('   - Check if PAYMENT_JWT_SECRET is set correctly');
  console.log('');
  console.log('2. Backend Code Not Deployed:');
  console.log('   - The payment integration code might not be deployed to production');
  console.log('   - Check if the latest backend code with payment integration is live');
  console.log('');
  console.log('3. JWT Secret Mismatch:');
  console.log('   - Production backend and payment microservice might have different JWT secrets');
  console.log('   - This would cause authentication failures');
  console.log('');
  console.log('4. Network Issues:');
  console.log('   - Production backend might not be able to reach payments.gumbotech.in');
  console.log('   - Firewall or security group blocking the connection');
  console.log('');
  
  // Test 4: Try different JWT secrets
  console.log('📡 Test 4: Testing Different JWT Secrets');
  
  const possibleSecrets = [
    'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh', // Local/dev secret
    'production_payment_secret', // Possible production secret
    'payment_microservice_jwt_secret', // Another possible secret
  ];
  
  for (const secret of possibleSecrets) {
    try {
      const testToken = jwt.sign(
        { userId, appId: packageName },
        secret,
        { expiresIn: '1h' }
      );
      
      const testResponse = await axios.get(
        `https://payments.gumbotech.in/api/payment/trial-eligibility?packageName=${packageName}`,
        {
          headers: {
            'Authorization': `Bearer ${testToken}`,
            'x-app-id': packageName,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      console.log(`✅ JWT secret works: ${secret.substring(0, 20)}...`);
      console.log('   Response:', testResponse.data.data.canUseTrial);
      break;
      
    } catch (error) {
      console.log(`❌ JWT secret failed: ${secret.substring(0, 20)}... (${error.response?.status || error.message})`);
    }
  }
  
  console.log('\n🔧 Recommended Actions:');
  console.log('');
  console.log('1. **Verify Environment Variables in Production:**');
  console.log('   ```bash');
  console.log('   USE_PAYMENT_MICROSERVICE=true');
  console.log('   PAYMENT_MICROSERVICE_URL=https://payments.gumbotech.in');
  console.log('   PAYMENT_JWT_SECRET=<correct_secret>');
  console.log('   PAYMENT_PACKAGE_ID=com.sunostories.app');
  console.log('   ```');
  console.log('');
  console.log('2. **Restart Production Backend Service:**');
  console.log('   - After updating environment variables, restart the service');
  console.log('');
  console.log('3. **Check Production Logs:**');
  console.log('   - Look for payment microservice call logs');
  console.log('   - Look for any error messages related to payment integration');
  console.log('');
  console.log('4. **Verify Code Deployment:**');
  console.log('   - Ensure the latest backend code with payment integration is deployed');
  console.log('   - Check if the subscription plans endpoint has the payment microservice integration');
}

testProductionIntegration().catch(console.error);
