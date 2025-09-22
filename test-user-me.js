const axios = require('axios');
const jwt = require('jsonwebtoken');

async function testUserMeEndpoint() {
  try {
    console.log('🧪 Testing /users/me/ endpoint for reactivated user...\n');
    
    // Generate a JWT token for the user
    const userId = '68c8892e647baaf418f1e207'; // The user ID we found
    const secret = process.env.JWT_SECRET || 'dhshdhfhbnhdbshi2934348n@1isdujhsdjkajdhkla';
    const token = jwt.sign(
      { userId }, 
      secret, 
      { 
        expiresIn: '24h',
        audience: 'kids-story-app',
        issuer: 'kids-story-api'
      }
    );
    
    console.log('🔑 Generated JWT token for user:', userId);
    console.log('🔑 Token preview:', token.substring(0, 50) + '...');
    
    // Test the /users/me endpoint
    console.log('\n📋 Testing GET /users/me endpoint...');
    
    const response = await axios.get('http://localhost:3002/api/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Request successful!');
    console.log('\n📊 Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Verify the response
    if (response.data.success) {
      console.log('\n🎉 SUCCESS: User can now access their profile!');
      console.log(`👤 User: ${response.data.data.name} (${response.data.data.email})`);
      console.log(`🔒 Active: ${response.data.data.isActive}`);
    } else {
      console.log('\n❌ Unexpected response format');
    }

  } catch (error) {
    console.error('❌ Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

// Load environment variables
require('dotenv').config();

testUserMeEndpoint();
