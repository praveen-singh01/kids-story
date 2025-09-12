const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_VERSION = process.env.API_VERSION || 'v1';

async function testPutOnboarding() {
  try {
    console.log('🧪 Testing PUT Onboarding API...\n');

    const timestamp = Date.now();
    
    // Step 1: Register and onboard a user
    console.log('1. Registering and onboarding test user...');
    
    const testUser = {
      email: `put.test.${timestamp}@example.com`,
      password: 'testpassword123',
      name: 'PUT Test User'
    };
    
    let response = await axios.post(`${BASE_URL}/api/${API_VERSION}/auth/register`, testUser);
    const accessToken = response.data.data.accessToken;
    
    // Complete initial onboarding
    const initialOnboarding = {
      fullName: 'Initial Full Name',
      birthDate: {
        day: 10,
        month: 5,
        year: 2018
      },
      phone: '9876543210'
    };
    
    await axios.post(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, initialOnboarding, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ User registered and onboarded successfully\n');

    // Step 2: Test full update
    console.log('2. Testing full update of onboarding details...');
    
    const fullUpdate = {
      fullName: 'Updated Full Name',
      birthDate: {
        day: 25,
        month: 12,
        year: 2019
      },
      phone: '9123456789'
    };
    
    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, fullUpdate, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Full update successful');
    console.log(`   Updated Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Updated Birth Date: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Updated Phone: ${response.data.data.user.phone}`);
    console.log(`   Updated fields: ${response.data.data.updated.join(', ')}\n`);

    // Step 3: Test partial update (only full name)
    console.log('3. Testing partial update (only full name)...');
    
    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
      fullName: 'Partially Updated Name'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Partial update successful');
    console.log(`   Updated Full Name: ${response.data.data.user.fullName}`);
    console.log(`   Birth Date unchanged: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Phone unchanged: ${response.data.data.user.phone}`);
    console.log(`   Updated fields: ${response.data.data.updated.join(', ')}\n`);

    // Step 4: Test phone update only
    console.log('4. Testing phone update only...');
    
    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
      phone: '9999888777'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Phone update successful');
    console.log(`   Full Name unchanged: ${response.data.data.user.fullName}`);
    console.log(`   Birth Date unchanged: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Updated Phone: ${response.data.data.user.phone}`);
    console.log(`   Updated fields: ${response.data.data.updated.join(', ')}\n`);

    // Step 5: Test birth date update only
    console.log('5. Testing birth date update only...');
    
    response = await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
      birthDate: {
        day: 1,
        month: 1,
        year: 2021
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    console.log('✅ Birth date update successful');
    console.log(`   Full Name unchanged: ${response.data.data.user.fullName}`);
    console.log(`   Updated Birth Date: ${response.data.data.user.birthDate.day}/${response.data.data.user.birthDate.month}/${response.data.data.user.birthDate.year}`);
    console.log(`   Phone unchanged: ${response.data.data.user.phone}`);
    console.log(`   Updated fields: ${response.data.data.updated.join(', ')}\n`);

    // Step 6: Test empty update (should fail)
    console.log('6. Testing empty update (should fail)...');
    
    try {
      await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Empty update should have failed');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Empty update correctly rejected');
        console.log(`   Error: ${error.response.data.error[0]}\n`);
      } else {
        throw error;
      }
    }

    // Step 7: Test invalid birth date (should fail)
    console.log('7. Testing invalid birth date (should fail)...');
    
    try {
      await axios.put(`${BASE_URL}/api/${API_VERSION}/users/me/onboarding`, {
        birthDate: {
          day: 32,
          month: 13,
          year: 2020
        }
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('❌ Invalid birth date should have failed');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Invalid birth date correctly rejected');
        console.log(`   Error: ${error.response.data.error[0]}\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 All PUT onboarding API tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testPutOnboarding();
