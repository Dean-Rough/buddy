// Comprehensive debug script for chat and navigation issues
console.log('🔍 COMPREHENSIVE DEBUG ANALYSIS\n');

// Test 1: Check server health
async function checkServerHealth() {
  console.log('📡 SERVER HEALTH CHECK:');
  try {
    const response = await fetch('http://localhost:4288/');
    console.log(`✅ Server responding: ${response.status}`);
  } catch (error) {
    console.log(`❌ Server down: ${error.message}`);
    return false;
  }
  return true;
}

// Test 2: Check API endpoints
async function checkApiEndpoints() {
  console.log('\n🔌 API ENDPOINT TESTS:');

  const endpoints = [
    { path: '/api/children', method: 'GET', needsAuth: true },
    { path: '/api/chat', method: 'POST', needsAuth: true },
    { path: '/api/parent/pin-status', method: 'GET', needsAuth: true },
  ];

  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (endpoint.method === 'POST' && endpoint.path === '/api/chat') {
        options.body = JSON.stringify({
          message: 'test',
          childAccountId: 'test-123',
        });
      }

      const response = await fetch(
        `http://localhost:4288${endpoint.path}`,
        options
      );
      const status = response.status;

      if (endpoint.needsAuth && status === 401) {
        console.log(
          `✅ ${endpoint.path} - Correctly requires auth (${status})`
        );
      } else if (status === 404) {
        console.log(`⚠️  ${endpoint.path} - Not found (${status})`);
      } else if (status >= 500) {
        console.log(`❌ ${endpoint.path} - Server error (${status})`);
      } else {
        console.log(`✅ ${endpoint.path} - Responding (${status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.path} - Failed: ${error.message}`);
    }
  }
}

// Test 3: Check static assets and routes
async function checkStaticAssets() {
  console.log('\n🖼️  STATIC ASSETS CHECK:');

  const assets = ['/onda-logo-black.svg', '/chat', '/parent', '/'];

  for (const asset of assets) {
    try {
      const response = await fetch(`http://localhost:4288${asset}`);
      if (response.ok) {
        console.log(`✅ ${asset} - Available (${response.status})`);
      } else {
        console.log(`❌ ${asset} - Missing (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${asset} - Failed: ${error.message}`);
    }
  }
}

// Test 4: Database connection
async function checkDatabaseConnection() {
  console.log('\n🗄️  DATABASE CONNECTION:');
  try {
    // Try a simple query that doesn't require auth
    const response = await fetch('http://localhost:4288/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', childAccountId: 'test' }),
    });

    if (response.status === 401) {
      console.log('✅ Database likely connected (auth working)');
    } else if (response.status === 404) {
      console.log('⚠️  Child not found - DB connected but no test data');
    } else if (response.status >= 500) {
      console.log('❌ Database connection issues');
    }
  } catch (error) {
    console.log(`❌ Database check failed: ${error.message}`);
  }
}

// Test 5: Check config files
async function checkConfigFiles() {
  console.log('\n📁 CONFIG FILES CHECK:');

  const configs = [
    'system-prompts.json',
    'ai-personas.json',
    'safety-rules.json',
  ];

  for (const config of configs) {
    try {
      const fs = require('fs');
      const path = require('path');
      const configPath = path.join(__dirname, 'config', config);

      if (fs.existsSync(configPath)) {
        const size = Math.round(fs.statSync(configPath).size / 1024);
        console.log(`✅ ${config} - ${size}KB`);
      } else {
        console.log(`❌ ${config} - Missing`);
      }
    } catch (error) {
      console.log(`❌ ${config} - Error: ${error.message}`);
    }
  }
}

// Main execution
async function runAllTests() {
  const serverOk = await checkServerHealth();
  if (!serverOk) {
    console.log('\n❌ Server is down - cannot run further tests');
    return;
  }

  await checkApiEndpoints();
  await checkStaticAssets();
  await checkDatabaseConnection();
  await checkConfigFiles();

  console.log('\n🎯 SUMMARY & RECOMMENDATIONS:');
  console.log('1. Chat API failing because:');
  console.log('   - Requires authentication (401 Unauthorized)');
  console.log('   - Needs real child account in database');
  console.log('');
  console.log('2. Parent dashboard navigation:');
  console.log('   - Route exists at /parent');
  console.log('   - Check browser console for JS errors');
  console.log('');
  console.log('3. Next steps:');
  console.log('   - Test with actual user authentication');
  console.log('   - Check browser network tab for navigation issues');
  console.log('   - Verify child account creation flow');
}

runAllTests();
