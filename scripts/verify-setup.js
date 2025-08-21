const axios = require('axios');
const config = require('../src/config');

/**
 * Verify that the API is running correctly
 */
async function verifySetup() {
  const baseUrl = `http://localhost:${config.port}`;
  
  console.log('🔍 Verifying Bedtime Stories API setup...\n');
  
  const tests = [
    {
      name: 'Health Check',
      url: `${baseUrl}/api/v1/healthz`,
      method: 'GET',
      expectedStatus: 200,
      check: (data) => data.success === true && data.data.status === 'healthy',
    },
    {
      name: 'Readiness Check',
      url: `${baseUrl}/api/v1/readyz`,
      method: 'GET',
      expectedStatus: 200,
      check: (data) => data.success === true,
    },
    {
      name: 'API Documentation',
      url: `${baseUrl}/docs`,
      method: 'GET',
      expectedStatus: 200,
      check: () => true, // Just check if it loads
    },
    {
      name: 'Content Categories',
      url: `${baseUrl}/api/v1/explore/categories`,
      method: 'GET',
      expectedStatus: 200,
      check: (data) => data.success === true && Array.isArray(data.data),
    },
    {
      name: 'Content List',
      url: `${baseUrl}/api/v1/explore/list?limit=5`,
      method: 'GET',
      expectedStatus: 200,
      check: (data) => data.success === true && data.data.content && data.data.pagination,
    },
    {
      name: 'OpenAPI Spec',
      url: `${baseUrl}/openapi.json`,
      method: 'GET',
      expectedStatus: 200,
      check: (data) => data.openapi && data.info && data.paths,
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}...`);
      
      const response = await axios({
        method: test.method,
        url: test.url,
        timeout: 5000,
        validateStatus: () => true, // Don't throw on non-2xx status
      });
      
      if (response.status !== test.expectedStatus) {
        console.log(`❌ ${test.name}: Expected status ${test.expectedStatus}, got ${response.status}`);
        failed++;
        continue;
      }
      
      if (test.check && !test.check(response.data)) {
        console.log(`❌ ${test.name}: Response validation failed`);
        failed++;
        continue;
      }
      
      console.log(`✅ ${test.name}: OK`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your Bedtime Stories API is ready to use.');
    console.log(`\n📚 Next steps:`);
    console.log(`   • Visit http://localhost:${config.port}/docs for API documentation`);
    console.log(`   • Run 'npm run seed' to add sample content`);
    console.log(`   • Set up your Google OAuth client ID in .env`);
    console.log(`   • Start building your frontend application!`);
  } else {
    console.log('❌ Some tests failed. Please check the API setup and try again.');
    process.exit(1);
  }
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySetup().catch(error => {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  });
}

module.exports = verifySetup;
