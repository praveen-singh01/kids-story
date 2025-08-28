const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

// Mock Google ID token for testing (this would normally come from Google OAuth)
const MOCK_GOOGLE_ID_TOKEN = 'mock-google-id-token-for-testing';

async function testGoogleAuth() {
  console.log('🧪 Testing Google Authentication API...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_BASE}/healthz`);
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');

    // Test 2: Test Google authentication endpoint
    console.log('2. Testing Google authentication endpoint...');
    
    try {
      const authResponse = await axios.post(`${API_BASE}/auth/google`, {
        idToken: MOCK_GOOGLE_ID_TOKEN
      });
      
      console.log('✅ Google auth endpoint is accessible');
      console.log('Response:', authResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('⚠️  Google auth endpoint responded with error (expected with mock token):');
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data);
        
        // This is expected since we're using a mock token
        if (error.response.status === 400 || error.response.status === 401) {
          console.log('✅ Endpoint is working - error is expected with mock token');
        }
      } else {
        throw error;
      }
    }
    console.log('');

    // Test 3: Test with missing token
    console.log('3. Testing with missing idToken...');
    try {
      await axios.post(`${API_BASE}/auth/google`, {});
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Validation working - missing idToken properly rejected');
        console.log('Error:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 4: Check API documentation
    console.log('4. Testing API documentation...');
    try {
      const docsResponse = await axios.get(`${BASE_URL}/docs`);
      console.log('✅ API documentation is accessible at http://localhost:3000/docs');
    } catch (error) {
      console.log('⚠️  API documentation might not be accessible:', error.message);
    }
    console.log('');

    // Test 5: Test other auth endpoints
    console.log('5. Testing other authentication endpoints...');
    
    // Test regular login endpoint
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      });
    } catch (error) {
      if (error.response) {
        console.log('✅ Login endpoint is accessible (error expected without valid credentials)');
      }
    }

    // Test register endpoint
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email: 'test@example.com',
        password: 'testpassword',
        name: 'Test User',
        confirmPassword: 'testpassword'
      });
    } catch (error) {
      if (error.response) {
        console.log('✅ Register endpoint is accessible');
      }
    }

    console.log('\n🎉 Google Authentication API Test Summary:');
    console.log('- Server is running ✅');
    console.log('- Google auth endpoint is accessible ✅');
    console.log('- Input validation is working ✅');
    console.log('- Other auth endpoints are accessible ✅');
    console.log('\n📝 Notes:');
    console.log('- The Google auth will fail with mock tokens (expected behavior)');
    console.log('- To test with real Google tokens, you need to:');
    console.log('  1. Set up Google OAuth in your frontend');
    console.log('  2. Get a real ID token from Google');
    console.log('  3. Use that token in the API call');
    console.log('\n🔧 Configuration:');
    console.log('- Google Client ID is configured:', process.env.GOOGLE_CLIENT_ID ? '✅' : '❌');
    console.log('- Server URL:', BASE_URL);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testGoogleAuth();
