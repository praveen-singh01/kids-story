const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const API_VERSION = process.env.API_VERSION || 'v1';

// Test user data with timestamp to ensure uniqueness
const timestamp = Date.now();
const testUser = {
  email: `onboarding.test.${timestamp}@example.com`,
  password: 'testpassword123',
  name: 'Test User'
};

// Onboarding data
const onboardingData = {
  fullName: 'John Doe Smith',
  birthDate: {
    day: 15,
    month: 6,
    year: 2020
  },
  phone: '9876543210'
};

async function testOnboardingAPI() {
  try {
    console.log('🧪 Testing Kids Story Onboarding API...\n');

    // Step 1: Register a new user
    console.log('1. Registering test user...');
    let response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/register`, testUser);
    
    if (!response.data.success) {
      throw new Error('User registration failed');
    }
    
    const accessToken = response.data.data.accessToken;
    console.log('✅ User registered successfully');
    console.log(`   User ID: ${response.data.data.user.id}`);
    console.log(`   Email: ${response.data.data.user.email}\n`);

    // Step 2: Check initial onboarding status
    console.log('2. Checking initial onboarding status...');
    response = await axios.get(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding-status`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Initial onboarding status:');
    console.log(`   isOnboarded: ${response.data.data.isOnboarded}`);
    console.log(`   hasFullName: ${response.data.data.hasFullName}`);
    console.log(`   hasBirthDate: ${response.data.data.hasBirthDate}`);
    console.log(`   hasPhone: ${response.data.data.hasPhone}\n`);

    // Step 3: Complete onboarding
    console.log('3. Completing onboarding...');
    response = await axios.post(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, onboardingData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.data.success) {
      throw new Error('Onboarding failed');
    }
    
    console.log('✅ Onboarding completed successfully');
    console.log(`   Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Birth Date: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Phone: ${response.data.data.user.phone}`);
    console.log(`   isOnboarded: ${response.data.data.user.isOnboarded}\n`);

    // Step 4: Check onboarding status after completion
    console.log('4. Checking onboarding status after completion...');
    response = await axios.get(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding-status`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Final onboarding status:');
    console.log(`   isOnboarded: ${response.data.data.isOnboarded}`);
    console.log(`   hasFullName: ${response.data.data.hasFullName}`);
    console.log(`   hasBirthDate: ${response.data.data.hasBirthDate}`);
    console.log(`   hasPhone: ${response.data.data.hasPhone}\n`);

    // Step 5: Try to onboard again (should fail)
    console.log('5. Attempting to onboard again (should fail)...');
    try {
      await axios.post(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, onboardingData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Second onboarding should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Second onboarding correctly rejected');
        console.log(`   Error: ${error.response.data.error[0]}\n`);
      } else {
        throw error;
      }
    }

    // Step 6: Test validation errors
    console.log('6. Testing validation errors...');
    
    // Register another user for validation tests
    const testUser2 = {
      email: `validation.test.${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Validation Test User'
    };
    
    response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/register`, testUser2);
    const accessToken2 = response.data.data.accessToken;
    
    // Test invalid birth date
    const invalidOnboardingData = {
      fullName: 'Jane Doe',
      birthDate: {
        day: 32, // Invalid day
        month: 6,
        year: 2020
      },
      phone: '9876543211'
    };
    
    try {
      await axios.post(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, invalidOnboardingData, {
        headers: { Authorization: `Bearer ${accessToken2}` }
      });
      console.log('❌ Invalid birth date should have failed but succeeded');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid birth date correctly rejected');
        console.log(`   Error: ${error.response.data.error[0]}\n`);
      } else {
        throw error;
      }
    }

    // Step 7: Test PUT endpoint to update onboarding details
    console.log('7. Testing PUT endpoint to update onboarding details...');

    const updateData = {
      fullName: 'John Doe Smith Updated',
      birthDate: {
        day: 20,
        month: 8,
        year: 2018
      },
      phone: '9123456789'
    };

    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, updateData, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Onboarding details updated successfully');
    console.log(`   Updated Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Updated Birth Date: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Updated Phone: ${response.data.data.user.phone}`);
    console.log(`   Updated fields: ${response.data.data.updated.join(', ')}\n`);

    // Step 8: Test partial update (only full name)
    console.log('8. Testing partial update (only full name)...');

    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
      fullName: 'Partially Updated Name'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('✅ Partial update successful');
    console.log(`   Updated Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Birth Date unchanged: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Phone unchanged: ${response.data.data.user.phone}\n`);

    // Step 9: Test PUT endpoint with non-onboarded user (should fail)
    console.log('9. Testing PUT endpoint with non-onboarded user (should fail)...');

    const testUser3 = {
      email: `not.onboarded.${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'Not Onboarded User'
    };

    response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/register`, testUser3);
    const accessToken3 = response.data.data.accessToken;

    try {
      await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
        fullName: 'Should Fail'
      }, {
        headers: { Authorization: `Bearer ${accessToken3}` }
      });
      console.log('❌ PUT request should have failed for non-onboarded user');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ PUT request correctly rejected for non-onboarded user');
        console.log(`   Error: ${error.response.data.error[0]}\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 All onboarding API tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testOnboardingAPI();
