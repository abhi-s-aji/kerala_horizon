#!/usr/bin/env node

/**
 * Kerala Horizon - Functionality Test Script
 * Tests all key features and API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:3000';

// Test configuration
const tests = [
  {
    name: 'Health Check',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Transport API',
    endpoint: '/transport/location?lat=10.5200&lng=76.3000&radius=5000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Food API',
    endpoint: '/food/restaurants/search?lat=10.5200&lng=76.3000&radius=5000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Stay API',
    endpoint: '/stay/search?lat=10.5200&lng=76.3000&radius=10000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Culture API',
    endpoint: '/culture/experiences?lat=10.5200&lng=76.3000&radius=20000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'SOS API',
    endpoint: '/sos/emergency-contacts?lat=10.5200&lng=76.3000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Shopping API',
    endpoint: '/shopping/stores?lat=10.5200&lng=76.3000&radius=10000',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Settings API',
    endpoint: '/settings/app',
    method: 'GET',
    expectedStatus: 200
  }
];

// Test results tracking
let passedTests = 0;
let failedTests = 0;
let totalTests = tests.length;

console.log('🧪 Kerala Horizon - Functionality Test Suite');
console.log('=============================================\n');

// Function to run individual test
async function runTest(test) {
  try {
    console.log(`🔍 Testing: ${test.name}`);
    
    const url = `${API_BASE_URL}${test.endpoint}`;
    const response = await axios({
      method: test.method,
      url: url,
      timeout: 10000,
      validateStatus: () => true // Accept any status code
    });

    if (response.status === test.expectedStatus) {
      console.log(`   ✅ PASS - Status: ${response.status}`);
      passedTests++;
    } else {
      console.log(`   ❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
      failedTests++;
    }

    // Show response data if available
    if (response.data && response.data.success !== undefined) {
      console.log(`   📊 Response: ${response.data.success ? 'Success' : 'Failed'}`);
    }

  } catch (error) {
    console.log(`   ❌ FAIL - Error: ${error.message}`);
    failedTests++;
  }
  
  console.log(''); // Empty line for readability
}

// Function to test frontend availability
async function testFrontend() {
  try {
    console.log('🌐 Testing Frontend Availability');
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (response.status === 200) {
      console.log('   ✅ Frontend is accessible');
      console.log('   🔗 URL: ' + FRONTEND_URL);
    }
  } catch (error) {
    console.log('   ⚠️  Frontend not accessible: ' + error.message);
    console.log('   💡 Make sure to run "npm start" in the frontend directory');
  }
  console.log('');
}

// Function to run all tests
async function runAllTests() {
  console.log('🚀 Starting test suite...\n');
  
  // Test backend APIs
  for (const test of tests) {
    await runTest(test);
  }
  
  // Test frontend
  await testFrontend();
  
  // Print summary
  console.log('📊 Test Results Summary');
  console.log('======================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! Kerala Horizon is fully functional!');
    console.log('🚀 Ready for production deployment!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the backend server.');
    console.log('💡 Make sure to run "node server.js" in the backend directory');
  }
  
  console.log('\n📖 For detailed deployment instructions, see DEPLOYMENT_GUIDE.md');
}

// Check if axios is available
try {
  require.resolve('axios');
} catch (error) {
  console.log('❌ Error: axios is not installed');
  console.log('💡 Please run: npm install axios');
  process.exit(1);
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});











