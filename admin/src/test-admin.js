/**
 * Simple test script to verify admin dashboard functionality
 * Run this with: node src/test-admin.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

// Test admin credentials (you'll need to create an admin user first)
const TEST_ADMIN = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;

async function testLogin() {
  console.log('🔐 Testing admin login...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, TEST_ADMIN);
    
    if (response.data.success && response.data.data.user.roles.includes('admin')) {
      authToken = response.data.data.accessToken;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Login failed: User is not an admin');
      return false;
    }
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testContentAPI() {
  console.log('📚 Testing content API...');
  
  try {
    const response = await axios.get(`${API_BASE}/admin/content`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Content API working, found', response.data.data.pagination.total, 'items');
    return true;
  } catch (error) {
    console.log('❌ Content API failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUsersAPI() {
  console.log('👥 Testing users API...');
  
  try {
    const response = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Users API working, found', response.data.data.pagination.total, 'users');
    return true;
  } catch (error) {
    console.log('❌ Users API failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testStatsAPI() {
  console.log('📊 Testing stats API...');
  
  try {
    const response = await axios.get(`${API_BASE}/admin/stats/overview`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Stats API working');
    console.log('   - Total Content:', response.data.data.totalContent);
    console.log('   - Total Users:', response.data.data.totalUsers);
    return true;
  } catch (error) {
    console.log('❌ Stats API failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Dashboard API Tests\n');
  
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without admin authentication');
    console.log('Please ensure:');
    console.log('1. Backend server is running on port 3000');
    console.log('2. Admin user exists with email: admin@example.com');
    console.log('3. Admin user has "admin" role');
    return;
  }
  
  console.log('');
  await testContentAPI();
  console.log('');
  await testUsersAPI();
  console.log('');
  await testStatsAPI();
  
  console.log('\n🎉 Admin Dashboard API tests completed!');
  console.log('\nNext steps:');
  console.log('1. Start the admin dashboard: npm run dev:admin');
  console.log('2. Open http://localhost:5173 in your browser');
  console.log('3. Login with admin credentials');
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Run the tests
runTests().catch(console.error);
