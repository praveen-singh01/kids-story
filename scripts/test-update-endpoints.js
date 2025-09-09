#!/usr/bin/env node

/**
 * Test script for all update endpoints
 * This script tests all PATCH, PUT, and POST endpoints to ensure they work correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';
let adminToken = '';
let userToken = '';
let testContentId = '';
let testUserId = '';

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = adminToken) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
const testAdminLogin = async () => {
  console.log('🔐 Testing Admin Login...');
  const result = await makeRequest('POST', '/auth/login', {
    email: 'admin@kidsstory.com',
    password: 'admin123456'
  }, null);

  if (result.success) {
    adminToken = result.data.data.accessToken;
    console.log('✅ Admin login successful');
    return true;
  } else {
    console.log('❌ Admin login failed:', result.error);
    return false;
  }
};

const testUserLogin = async () => {
  console.log('🔐 Testing User Login...');
  const result = await makeRequest('POST', '/auth/login', {
    email: 'testuser@example.com',
    password: 'password123'
  }, null);

  if (result.success) {
    userToken = result.data.data.accessToken;
    console.log('✅ User login successful');
    return true;
  } else {
    console.log('⚠️  User login failed (might not exist):', result.error);
    return false;
  }
};

const testGetContent = async () => {
  console.log('📚 Getting content for testing...');
  const result = await makeRequest('GET', '/admin/content?limit=1');

  if (result.success && result.data.data.content.length > 0) {
    testContentId = result.data.data.content[0]._id;
    console.log('✅ Content ID obtained:', testContentId);
    return true;
  } else {
    console.log('❌ Failed to get content:', result.error);
    return false;
  }
};

const testUpdateContent = async () => {
  if (!testContentId) {
    console.log('⚠️  Skipping content update - no content ID');
    return false;
  }

  console.log('🔧 Testing Content Update...');
  const result = await makeRequest('PATCH', `/admin/content/${testContentId}`, {
    title: 'Updated Test Title',
    description: 'Updated test description',
    featured: true,
    isNewCollection: true,
    isTrendingNow: false
  });

  if (result.success) {
    console.log('✅ Content update successful');
    return true;
  } else {
    console.log('❌ Content update failed:', result.error);
    return false;
  }
};

const testToggleFeatured = async () => {
  if (!testContentId) {
    console.log('⚠️  Skipping featured toggle - no content ID');
    return false;
  }

  console.log('⭐ Testing Featured Toggle...');
  const result = await makeRequest('PATCH', `/admin/content/${testContentId}/featured`, {
    featured: false
  });

  if (result.success) {
    console.log('✅ Featured toggle successful');
    return true;
  } else {
    console.log('❌ Featured toggle failed:', result.error);
    return false;
  }
};

const testCreateContent = async () => {
  console.log('📝 Testing Content Creation...');
  const result = await makeRequest('POST', '/admin/content', {
    title: 'Test API Story',
    description: 'A story created via API test',
    type: 'story',
    ageRange: '6-8',
    language: 'en',
    audioUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/audio/test.mp3',
    imageUrl: 'https://d1ta1qd8y4woyq.cloudfront.net/uploads/image/test.png',
    durationSec: 120,
    featured: false,
    isNewCollection: false,
    isTrendingNow: true
  });

  if (result.success) {
    console.log('✅ Content creation successful');
    return true;
  } else {
    console.log('❌ Content creation failed:', result.error);
    return false;
  }
};

const testGetUsers = async () => {
  console.log('👥 Getting users for testing...');
  const result = await makeRequest('GET', '/admin/users?page=1&limit=1');

  if (result.success && result.data.data.users.length > 0) {
    testUserId = result.data.data.users[0]._id;
    console.log('✅ User ID obtained:', testUserId);
    return true;
  } else {
    console.log('❌ Failed to get users:', result.error);
    return false;
  }
};

const testCreateUser = async () => {
  console.log('👤 Testing User Creation...');
  const result = await makeRequest('POST', '/admin/users', {
    name: 'API Test User',
    email: `apitest${Date.now()}@example.com`,
    password: 'password123',
    provider: 'email',
    roles: ['user'],
    subscription: {
      plan: 'free',
      status: 'active'
    },
    isActive: true
  });

  if (result.success) {
    console.log('✅ User creation successful');
    return true;
  } else {
    console.log('❌ User creation failed:', result.error);
    return false;
  }
};

const testUpdateUser = async () => {
  if (!testUserId) {
    console.log('⚠️  Skipping user update - no user ID');
    return false;
  }

  console.log('🔧 Testing User Update...');
  const result = await makeRequest('PATCH', `/admin/users/${testUserId}`, {
    name: 'Updated API Test User',
    subscription: {
      plan: 'premium',
      status: 'active'
    }
  });

  if (result.success) {
    console.log('✅ User update successful');
    return true;
  } else {
    console.log('❌ User update failed:', result.error);
    return false;
  }
};

const testUpdateProfile = async () => {
  if (!userToken) {
    console.log('⚠️  Skipping profile update - no user token');
    return false;
  }

  console.log('👤 Testing Profile Update...');
  const result = await makeRequest('PATCH', '/users/me', {
    name: 'Updated Profile Name'
  }, userToken);

  if (result.success) {
    console.log('✅ Profile update successful');
    return true;
  } else {
    console.log('❌ Profile update failed:', result.error);
    return false;
  }
};

const testFiltering = async () => {
  console.log('🔍 Testing Content Filtering...');
  
  const filters = [
    { name: 'New Collection', query: '?newcollection=true' },
    { name: 'Trending Now', query: '?trendingnow=true' },
    { name: 'Hindi Language', query: '?language=hi' },
    { name: 'English Language', query: '?language=en' },
    { name: 'Story Type', query: '?type=story' }
  ];

  let successCount = 0;
  for (const filter of filters) {
    const result = await makeRequest('GET', `/content${filter.query}`, null, null);
    if (result.success) {
      console.log(`✅ ${filter.name} filter: ${result.data.data.content.length} items`);
      successCount++;
    } else {
      console.log(`❌ ${filter.name} filter failed:`, result.error);
    }
  }

  return successCount === filters.length;
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Update Endpoints Test Suite\n');

  const tests = [
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Get Content', fn: testGetContent },
    { name: 'Update Content', fn: testUpdateContent },
    { name: 'Toggle Featured', fn: testToggleFeatured },
    { name: 'Create Content', fn: testCreateContent },
    { name: 'Get Users', fn: testGetUsers },
    { name: 'Create User', fn: testCreateUser },
    { name: 'Update User', fn: testUpdateUser },
    { name: 'Update Profile', fn: testUpdateProfile },
    { name: 'Content Filtering', fn: testFiltering }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('🎉 All tests passed! Update endpoints are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
