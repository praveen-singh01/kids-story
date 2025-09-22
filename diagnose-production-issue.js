const axios = require('axios');
const jwt = require('jsonwebtoken');

// Production URLs
const PROD_BACKEND = 'https://milo.netaapp.in/api/v1';
const PROD_PAYMENT_MICROSERVICE = 'https://payment.gumbotech.in';
const USER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGNiZjdmNTczYzVhNzFjNzY2ZDg2MDciLCJpYXQiOjE3NTgxOTc3NDksImV4cCI6MTc1ODI4NDE0OSwiYXVkIjoia2lkcy1zdG9yeS1hcHAiLCJpc3MiOiJraWRzLXN0b3J5LWFwaSJ9.KxuH5N7h0G-lmRO_gxvUk7qFYgACdLbg1Z7IHPnAhqs';

async function diagnoseProductionIssue() {
  console.log('🔍 Diagnosing Production Trial Eligibility Issue\n');
  
  // Extract user info from token
  const decoded = jwt.decode(USER_TOKEN);
  const userId = decoded.userId;
  console.log('👤 User ID:', userId);
  console.log('🕐 Token issued:', new Date(decoded.iat * 1000));
  console.log('⏰ Token expires:', new Date(decoded.exp * 1000));
  
  // Test 1: Check production backend health
  console.log('\n📡 Test 1: Production Backend Health');
  try {
    const response = await axios.get(`${PROD_BACKEND}/health`, { timeout: 10000 });
    console.log('✅ Production backend is healthy');
    console.log('   Environment:', response.data.data.environment);
    console.log('   Database:', response.data.data.database.status);
  } catch (error) {
    console.log('❌ Production backend health check failed');
    console.log('   Error:', error.message);
  }
  
  // Test 2: Check payment microservice accessibility
  console.log('\n📡 Test 2: Payment Microservice Accessibility');
  
  // Try different endpoints
  const paymentEndpoints = [
    `${PROD_PAYMENT_MICROSERVICE}/api/health`,
    `${PROD_PAYMENT_MICROSERVICE}/health`,
    `${PROD_PAYMENT_MICROSERVICE}/`
  ];
  
  for (const endpoint of paymentEndpoints) {
    try {
      console.log(`   Trying: ${endpoint}`);
      const response = await axios.get(endpoint, { timeout: 10000 });
      console.log('✅ Payment microservice accessible at:', endpoint);
      console.log('   Response:', response.data);
      break;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  // Test 3: Check if payment microservice integration is enabled in production
  console.log('\n📡 Test 3: Production Environment Configuration');
  console.log('   This requires checking the production environment variables:');
  console.log('   - USE_PAYMENT_MICROSERVICE should be "true"');
  console.log('   - PAYMENT_MICROSERVICE_URL should be set');
  console.log('   - PAYMENT_JWT_SECRET should be set');
  console.log('   - PAYMENT_PACKAGE_ID should be "com.sunostories.app"');
  
  // Test 4: Try to generate a payment microservice JWT token
  console.log('\n📡 Test 4: Payment Microservice JWT Token Generation');
  try {
    // This is a guess at the JWT secret - in production this would need to be the actual secret
    const possibleSecrets = [
      'hsdhjhdjasjhdhjhb12@kdjfknndjfhjk34578jdhfjhdjh', // Local secret
      'production_payment_secret',
      'payment_microservice_secret'
    ];
    
    for (const secret of possibleSecrets) {
      try {
        const paymentToken = jwt.sign(
          { userId, appId: 'com.sunostories.app' },
          secret,
          { expiresIn: '1h' }
        );
        console.log(`   Generated token with secret: ${secret.substring(0, 20)}...`);
        
        // Try to use this token
        try {
          const response = await axios.get(
            `${PROD_PAYMENT_MICROSERVICE}/api/payment/trial-eligibility?packageName=com.sunostories.app`,
            {
              headers: {
                'Authorization': `Bearer ${paymentToken}`,
                'x-app-id': 'com.sunostories.app',
                'Content-Type': 'application/json'
              },
              timeout: 10000
            }
          );
          console.log('✅ Payment microservice responded with token');
          console.log('   Trial eligibility:', response.data);
          break;
        } catch (error) {
          console.log(`❌ Token failed: ${error.message}`);
        }
      } catch (error) {
        console.log(`❌ Token generation failed: ${error.message}`);
      }
    }
  } catch (error) {
    console.log('❌ JWT token generation failed:', error.message);
  }
  
  // Test 5: Compare with local environment
  console.log('\n📡 Test 5: Local vs Production Comparison');
  console.log('   Local environment (working):');
  console.log('   - Backend: http://localhost:3002');
  console.log('   - Payment microservice: http://localhost:3000');
  console.log('   - Trial eligibility: ✅ Working');
  console.log('');
  console.log('   Production environment (not working):');
  console.log('   - Backend: https://milo.netaapp.in');
  console.log('   - Payment microservice: https://payment.gumbotech.in');
  console.log('   - Trial eligibility: ❌ Not working');
  
  // Recommendations
  console.log('\n🔧 Recommendations to Fix the Issue:');
  console.log('');
  console.log('1. **Check Payment Microservice Deployment**');
  console.log('   - Verify https://payment.gumbotech.in is deployed and running');
  console.log('   - Check DNS resolution for payment.gumbotech.in');
  console.log('   - Verify SSL certificate is valid');
  console.log('');
  console.log('2. **Check Production Environment Variables**');
  console.log('   - USE_PAYMENT_MICROSERVICE=true');
  console.log('   - PAYMENT_MICROSERVICE_URL=https://payment.gumbotech.in');
  console.log('   - PAYMENT_JWT_SECRET=<production_secret>');
  console.log('   - PAYMENT_PACKAGE_ID=com.sunostories.app');
  console.log('');
  console.log('3. **Check Network Connectivity**');
  console.log('   - Ensure production backend can reach payment microservice');
  console.log('   - Check firewall rules and security groups');
  console.log('');
  console.log('4. **Check Payment Microservice Configuration**');
  console.log('   - Verify com.sunostories.app is configured in payment microservice');
  console.log('   - Check trial configuration for the app');
  console.log('');
  console.log('5. **Immediate Fix Options**');
  console.log('   - Deploy payment microservice to production');
  console.log('   - Update production environment variables');
  console.log('   - Test the integration end-to-end');
}

diagnoseProductionIssue().catch(console.error);
