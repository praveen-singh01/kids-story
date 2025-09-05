const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Test script to verify Google OAuth setup for Android
async function testGoogleAuth() {
  console.log('🔍 Testing Google OAuth Configuration for Android...\n');
  
  const clientId = process.env.GOOGLE_CLIENT_ID || '148544260914-fvanm64tpsqgev2e3qn1g5a7rie7qeij.apps.googleusercontent.com';
  
  console.log('📋 Configuration:');
  console.log(`   Client ID: ${clientId}`);
  console.log(`   Project ID: kids-story-6f0dd`);
  console.log(`   Backend URL: http://localhost:3000/api/v1\n`);
  
  // Test 1: Verify OAuth2Client initialization
  console.log('🧪 Test 1: OAuth2Client Initialization');
  try {
    const client = new OAuth2Client(clientId);
    console.log('   ✅ OAuth2Client initialized successfully\n');
  } catch (error) {
    console.log('   ❌ Failed to initialize OAuth2Client:', error.message);
    return;
  }
  
  // Test 2: Test backend endpoint availability
  console.log('🧪 Test 2: Backend Endpoint Availability');
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/google', {
      idToken: 'invalid-token-for-testing'
    });
    console.log('   ❌ Unexpected success with invalid token');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('   ✅ Backend correctly rejects invalid tokens\n');
    } else {
      console.log('   ❌ Unexpected error:', error.message);
      return;
    }
  }
  
  console.log('🎯 Next Steps:');
  console.log('   1. Run your Flutter app on an Android device/emulator');
  console.log('   2. Try Google Sign-In from the app');
  console.log('   3. Check the Flutter console for token logs');
  console.log('   4. The app should now authenticate with your local backend\n');
  
  console.log('📱 Flutter App Configuration:');
  console.log('   • Mock auth disabled (will use real Google OAuth)');
  console.log('   • API base URL set to http://localhost:3000/api/v1');
  console.log('   • Google Client ID updated to match Android configuration\n');
  
  console.log('🔧 Troubleshooting:');
  console.log('   • Make sure your Android device can reach localhost:3000');
  console.log('   • For emulator: use 10.0.2.2:3000 instead of localhost:3000');
  console.log('   • For physical device: use your computer\'s IP address');
  console.log('   • Check that Google Play Services is updated on the device');
}

// Run the test
require('dotenv').config();
testGoogleAuth().catch(console.error);
