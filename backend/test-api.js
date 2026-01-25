#!/usr/bin/env node

/**
 * Simple Node.js test script for the Forecasting API
 * Run: node test-api.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Helper to make HTTP requests
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: data ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=========================================');
  console.log('Forecasting API Test Suite');
  console.log('=========================================\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const result = await request('GET', '/health');
    if (result.status === 200) {
      console.log('   ✓ Health check passed (200)');
      console.log('   Response:', JSON.stringify(result.data));
    } else {
      console.log(`   ✗ Health check failed (${result.status})`);
    }
  } catch (error) {
    console.log('   ✗ Server not running:', error.message);
    console.log('   Start server with: npm run dev');
    process.exit(1);
  }
  console.log('');

  // Test 2: ED Hourly
  console.log('2. Testing ED Hourly Endpoint...');
  try {
    const result = await request('GET', '/api/ui/ed/hourly?from=2020-01-01&to=2020-01-31');
    if (result.status === 200) {
      const count = Array.isArray(result.data) ? result.data.length : '?';
      console.log(`   ✓ ED Hourly passed (200) - ${count} records`);
    } else {
      console.log(`   ✗ ED Hourly failed (${result.status})`);
      console.log('   Response:', JSON.stringify(result.data));
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 3: Staff Day
  console.log('3. Testing Staff Day Endpoint...');
  try {
    const result = await request('GET', '/api/ui/staff/day?date=2026-01-24');
    if (result.status === 200) {
      const count = Array.isArray(result.data) ? result.data.length : '?';
      console.log(`   ✓ Staff Day passed (200) - ${count} records`);
    } else {
      console.log(`   ✗ Staff Day failed (${result.status})`);
      console.log('   Response:', JSON.stringify(result.data));
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 4: Inventory Risk
  console.log('4. Testing Inventory Risk Endpoint...');
  try {
    const result = await request('GET', '/api/ui/inventory/risk?days=7');
    if (result.status === 200) {
      const count = Array.isArray(result.data) ? result.data.length : '?';
      console.log(`   ✓ Inventory Risk passed (200) - ${count} records`);
    } else {
      console.log(`   ✗ Inventory Risk failed (${result.status})`);
      console.log('   Response:', JSON.stringify(result.data));
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 5: Agent Context
  console.log('5. Testing Agent Context Endpoint...');
  try {
    const result = await request('GET', '/api/agent/context?from=2020-01-01&to=2020-01-31&date=2026-01-24');
    if (result.status === 200) {
      console.log('   ✓ Agent Context passed (200)');
      const ed = Array.isArray(result.data.ed_hourly) ? result.data.ed_hourly.length : '?';
      const staff = Array.isArray(result.data.staff_day) ? result.data.staff_day.length : '?';
      const inv = Array.isArray(result.data.inventory_risk_7d) ? result.data.inventory_risk_7d.length : '?';
      const events = Array.isArray(result.data.events) ? result.data.events.length : '?';
      console.log(`   - ED Hourly: ${ed} records`);
      console.log(`   - Staff Day: ${staff} records`);
      console.log(`   - Inventory Risk: ${inv} records`);
      console.log(`   - Events: ${events} records`);
    } else {
      console.log(`   ✗ Agent Context failed (${result.status})`);
      console.log('   Response:', JSON.stringify(result.data));
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 6: Agent Outputs (POST)
  console.log('6. Testing Agent Outputs Endpoint (POST)...');
  try {
    const payload = {
      agent_name: 'test_agent',
      output_type: 'test',
      window_start: '2020-01-15',
      window_end: '2020-01-22',
      payload: { test: 'data', recommendation: 'Test recommendation' },
    };
    const result = await request('POST', '/api/agent/outputs', payload);
    if (result.status === 201) {
      const id = result.data.id || '?';
      console.log(`   ✓ Agent Outputs POST passed (201) - ID: ${id}`);
    } else {
      console.log(`   ✗ Agent Outputs POST failed (${result.status})`);
      console.log('   Response:', JSON.stringify(result.data));
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // Test 7: Error Handling
  console.log('7. Testing Error Handling...');
  try {
    const result = await request('GET', '/api/ui/ed/hourly');
    if (result.status === 400) {
      console.log('   ✓ Error handling works (400 for missing params)');
    } else {
      console.log(`   ⚠ Expected 400, got ${result.status}`);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  console.log('=========================================');
  console.log('Test Suite Complete');
  console.log('=========================================');
}

runTests().catch(console.error);
