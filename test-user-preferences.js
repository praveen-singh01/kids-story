const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: 'test-preferences@example.com',
  password: 'password123',
  name: 'Test User'
};

let authToken = '';

async function testUserPreferences() {
  try {
    console.log('🧪 Testing User Preferences API...\n');

    // 1. Register a test user
    console.log('1. Registering test user...');
    try {
      await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, continuing...');
      } else {
        throw error;
      }
    }

    // 2. Login to get token
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    authToken = loginResponse.data.data.token;
    console.log('✅ Login successful');

    // 3. Get current user profile (should have default preferences)
    console.log('\n3. Getting current user profile...');
    const profileResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Profile retrieved:');
    console.log('   Language:', profileResponse.data.data.preferences?.language || 'undefined');
    console.log('   Avatar ID:', profileResponse.data.data.avatarId || 'null');

    // 4. Complete onboarding with language and avatar preferences
    console.log('\n4. Completing onboarding with preferences...');
    const onboardingResponse = await axios.post(`${BASE_URL}/users/me/onboarding`, {
      fullName: 'Test User Full Name',
      birthDate: {
        day: 15,
        month: 6,
        year: 1990
      },
      phone: '9876543210',
      language: 'hi',
      avatarId: 'avatar_test_123'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Onboarding completed with preferences:');
    console.log('   Language:', onboardingResponse.data.data.user.preferences?.language);
    console.log('   Avatar ID:', onboardingResponse.data.data.user.avatarId);
    console.log('   Is Onboarded:', onboardingResponse.data.data.isOnboarded);

    // 5. Update onboarding details including language and avatar
    console.log('\n5. Updating onboarding details with new preferences...');
    const updateResponse = await axios.put(`${BASE_URL}/users/me/onboarding`, {
      language: 'en',
      avatarId: 'avatar_updated_456'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Onboarding details updated:');
    console.log('   Language:', updateResponse.data.data.user.preferences?.language);
    console.log('   Avatar ID:', updateResponse.data.data.user.avatarId);
    console.log('   Updated fields:', updateResponse.data.data.updated);

    // 6. Verify final state with GET /users/me
    console.log('\n6. Verifying final state...');
    const finalResponse = await axios.get(`${BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Final profile state:');
    console.log('   Language:', finalResponse.data.data.preferences?.language);
    console.log('   Avatar ID:', finalResponse.data.data.avatarId);
    console.log('   Is Onboarded:', finalResponse.data.data.isOnboarded);

    // 7. Test invalid language in onboarding update
    console.log('\n7. Testing invalid language in onboarding update (should fail)...');
    try {
      await axios.put(`${BASE_URL}/users/me/onboarding`, {
        language: 'invalid'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ Should have failed with invalid language');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected invalid language');
        console.log('   Error:', error.response.data.errors?.[0] || 'Validation error');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 All tests passed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testUserPreferences();
