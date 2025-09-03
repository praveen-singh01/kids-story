/**
 * Manual Google Authentication Test Script
 * 
 * This script helps you test Google authentication with real Google ID tokens.
 * You'll need to obtain a Google ID token from your Flutter app or web client.
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api/v1';

class GoogleAuthTester {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async testHealthCheck() {
    console.log('🔍 Testing API health...');
    try {
      const response = await this.apiClient.get('/health');
      console.log('✅ API is healthy:', response.data);
      return true;
    } catch (error) {
      console.error('❌ API health check failed:', error.message);
      return false;
    }
  }

  async testGoogleAuth(idToken) {
    console.log('🔐 Testing Google authentication...');
    try {
      const response = await this.apiClient.post('/auth/google', {
        idToken: idToken
      });

      console.log('✅ Google authentication successful!');
      console.log('User:', {
        id: response.data.data.user.id,
        email: response.data.data.user.email,
        name: response.data.data.user.name,
        provider: response.data.data.user.provider,
        emailVerified: response.data.data.user.emailVerified
      });
      console.log('Access Token:', response.data.data.accessToken.substring(0, 20) + '...');
      
      return response.data.data;
    } catch (error) {
      console.error('❌ Google authentication failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      return null;
    }
  }

  async testProtectedEndpoint(accessToken) {
    console.log('🔒 Testing protected endpoint with access token...');
    try {
      const response = await this.apiClient.get('/users/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      console.log('✅ Protected endpoint access successful!');
      console.log('User profile:', response.data.data);
      return true;
    } catch (error) {
      console.error('❌ Protected endpoint access failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      return false;
    }
  }

  async testTokenRefresh(refreshToken) {
    console.log('🔄 Testing token refresh...');
    try {
      const response = await this.apiClient.post('/auth/refresh', {
        refreshToken: refreshToken
      });

      console.log('✅ Token refresh successful!');
      console.log('New Access Token:', response.data.data.accessToken.substring(0, 20) + '...');
      return response.data.data;
    } catch (error) {
      console.error('❌ Token refresh failed:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
      return null;
    }
  }

  async runFullTest(idToken) {
    console.log('🚀 Starting Google Authentication Full Test\n');

    // Test 1: Health Check
    const isHealthy = await this.testHealthCheck();
    if (!isHealthy) {
      console.log('❌ Stopping tests - API is not healthy');
      return;
    }
    console.log('');

    // Test 2: Google Authentication
    const authResult = await this.testGoogleAuth(idToken);
    if (!authResult) {
      console.log('❌ Stopping tests - Google authentication failed');
      return;
    }
    console.log('');

    // Test 3: Protected Endpoint
    await this.testProtectedEndpoint(authResult.accessToken);
    console.log('');

    // Test 4: Token Refresh
    await this.testTokenRefresh(authResult.refreshToken);
    console.log('');

    console.log('🎉 All tests completed!');
  }
}

// Usage instructions
function printUsageInstructions() {
  console.log(`
📋 Google Authentication Test Instructions:

1. Start your backend server:
   npm run dev

2. Get a Google ID token from your client application:
   - For Flutter: Use google_sign_in package to get idToken
   - For Web: Use Google Sign-In JavaScript library
   - For Testing: Use Google OAuth Playground

3. Run this test script:
   node tests/manual-google-auth-test.js <YOUR_GOOGLE_ID_TOKEN>

Example:
   node tests/manual-google-auth-test.js eyJhbGciOiJSUzI1NiIsImtpZCI6...

Environment Variables Required:
   - GOOGLE_CLIENT_ID: Your Google OAuth client ID
   - JWT_SECRET: Your JWT secret key
   - MONGODB_URI: Your MongoDB connection string

🔗 Get Google ID Token for Testing:
   1. Go to: https://developers.google.com/oauthplayground/
   2. Select "Google OAuth2 API v2"
   3. Select "https://www.googleapis.com/auth/userinfo.email"
   4. Click "Authorize APIs"
   5. Click "Exchange authorization code for tokens"
   6. Copy the "id_token" value
`);
}

// Main execution
async function main() {
  const idToken = process.argv[2];

  if (!idToken) {
    printUsageInstructions();
    process.exit(1);
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('❌ GOOGLE_CLIENT_ID environment variable is required');
    process.exit(1);
  }

  const tester = new GoogleAuthTester();
  await tester.runFullTest(idToken);
}

// Export for use in other scripts
module.exports = GoogleAuthTester;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
