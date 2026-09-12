#!/usr/bin/env node

/**
 * Production Smoke Tests
 * Tests critical functionality against a deployed environment
 */

const BASE_URL = process.env.SMOKE_TEST_URL || 'https://haltest.com';
const TIMEOUT = 30000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(1000 * (i + 1));
    }
  }
}

async function testHealthEndpoint() {
  console.log('🏥 Testing /api/status...');
  const response = await fetchWithRetry(`${BASE_URL}/api/status`);
  if (!response.ok) throw new Error(`Status ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok') throw new Error('Status not ok');
  console.log(`   ✅ Version: ${data.version}, Commit: ${data.git?.shortCommit}`);
  return data;
}

async function testFrontend() {
  console.log('🌐 Testing frontend (/app/)...');
  const response = await fetchWithRetry(`${BASE_URL}/app/`);
  if (response.status !== 200) throw new Error(`Frontend returned ${response.status}`);
  const html = await response.text();
  if (!html.includes('haltest') && !html.includes('HAL-TEST') && !html.includes('root')) {
    throw new Error('Frontend HTML does not contain expected content');
  }
  console.log('   ✅ Frontend loads');
}

async function testLandingPage() {
  console.log('🏠 Testing landing page (/)...');
  const response = await fetchWithRetry(`${BASE_URL}/`);
  if (response.status !== 200) throw new Error(`Landing returned ${response.status}`);
  console.log('   ✅ Landing page loads');
}

async function testDoctorEndpoint() {
  console.log('🩺 Testing /api/doctor...');
  const response = await fetchWithRetry(`${BASE_URL}/api/doctor`);
  if (!response.ok) throw new Error(`Doctor returned ${response.status}`);
  const data = await response.json();
  if (!data.playwright || !data.playwright.installed) {
    console.log('   ⚠️ Playwright not fully installed:', data.playwright);
  } else {
    console.log('   ✅ Doctor reports Playwright ready');
  }
}

async function testApiEndpoints() {
  console.log('🔌 Testing API endpoints (unauthenticated)...');
  
  // Test docs endpoint
  const docsResponse = await fetchWithRetry(`${BASE_URL}/api/docs`);
  if (docsResponse.status !== 200) {
    console.log('   ⚠️ /api/docs returned', docsResponse.status);
  } else {
    console.log('   ✅ /api/docs accessible');
  }
  
  // Test 404 handling
  const notFoundResponse = await fetchWithRetry(`${BASE_URL}/api/nonexistent`);
  if (notFoundResponse.status !== 404) {
    console.log('   ⚠️ 404 handling unexpected:', notFoundResponse.status);
  } else {
    console.log('   ✅ 404 handling works');
  }
}

async function testWebSocket() {
  console.log('🔌 Testing Socket.io connection...');
  // Just verify the endpoint responds
  try {
    const response = await fetchWithRetry(`${BASE_URL}/socket.io/?EIO=4&transport=polling`);
    if (response.status === 200 || response.status === 400) {
      console.log('   ✅ Socket.io endpoint responds');
    } else {
      console.log('   ⚠️ Socket.io returned', response.status);
    }
  } catch (e) {
    console.log('   ⚠️ Socket.io test skipped:', e.message);
  }
}

async function runAllTests() {
  console.log(`\n🚀 Starting smoke tests against: ${BASE_URL}\n`);
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Frontend', fn: testFrontend },
    { name: 'Landing Page', fn: testLandingPage },
    { name: 'Doctor Endpoint', fn: testDoctorEndpoint },
    { name: 'API Endpoints', fn: testApiEndpoints },
    { name: 'WebSocket', fn: testWebSocket },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test.fn();
      passed++;
    } catch (error) {
      console.log(`   ❌ ${test.name} failed: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
  
  console.log('\n✅ All smoke tests passed!');
}

runAllTests().catch(error => {
  console.error('❌ Smoke test runner failed:', error);
  process.exit(1);
});