#!/usr/bin/env node

/**
 * Functional E2E Smoke Tests
 * Tests critical user workflows against a deployed environment
 */

const BASE_URL = process.env.SMOKE_TEST_URL || 'http://localhost:2001';
const TIMEOUT = 60000;

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

class SmokeTestClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = null;
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return fetchWithRetry(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });
  }

  async createProject(name, description) {
    const response = await this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Create project failed: ${response.status} - ${error.error || JSON.stringify(error)}`);
    }
    return response.json();
  }

  async listProjects() {
    const response = await this.request('/api/projects');
    if (!response.ok) throw new Error(`List projects failed: ${response.status}`);
    return response.json();
  }

  async createFlow(projectId, flowData) {
    const response = await this.request(`/api/projects/${projectId}/flows`, {
      method: 'POST',
      body: JSON.stringify(flowData),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Create flow failed: ${response.status} - ${error.error || JSON.stringify(error)}`);
    }
    return response.json();
  }

  async getFlow(projectId, flowId) {
    const response = await this.request(`/api/projects/${projectId}/flows/${flowId}`);
    if (!response.ok) throw new Error(`Get flow failed: ${response.status}`);
    return response.json();
  }

  async executeFlow(projectId, flowId, options = {}) {
    const response = await this.request('/api/runs/start', {
      method: 'POST',
      body: JSON.stringify({
        flowId,
        projectId,
        overrides: options,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Execute flow failed: ${response.status} - ${error.error || JSON.stringify(error)}`);
    }
    return response.json();
  }

  async getRunDetails(runId) {
    const response = await this.request(`/api/runs/${runId}`);
    if (!response.ok) throw new Error(`Get run details failed: ${response.status}`);
    return response.json();
  }

  async waitForRunCompletion(runId, maxWaitMs = 60000) {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      await sleep(2000);
      const run = await this.getRunDetails(runId);
      if (run.status === 'completed' || run.status === 'failed') {
        return run;
      }
    }
    throw new Error(`Flow did not complete in ${maxWaitMs}ms`);
  }
}

async function runFunctionalTests() {
  console.log(`\n🚀 Starting functional smoke tests against: ${BASE_URL}\n`);
  
  const client = new SmokeTestClient(BASE_URL);
  let passed = 0;
  let failed = 0;
  const results = [];

  async function runTest(name, fn) {
    console.log(`🧪 ${name}...`);
    try {
      await fn(client);
      console.log(`   ✅ ${name}`);
      passed++;
      results.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`   ❌ ${name}: ${error.message}`);
      failed++;
      results.push({ name, status: 'failed', error: error.message });
    }
  }

  // Test 1: Health check
  await runTest('Health Check', async (client) => {
    const response = await client.request('/api/status');
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('Status not ok');
  });

  // Test 2: Authentication (Guest Mode check)
  await runTest('Authentication (Guest Mode)', async (client) => {
    const response = await client.request('/api/status');
    const data = await response.json();
    if (data.auth_enabled) {
      // If auth is enabled, we'd test login
      console.log('   (Auth enabled - login test would run here)');
    } else {
      console.log('   (Auth disabled - guest mode)');
    }
  });

  // Test 3: Project CRUD
  let testProjectId = null;
  await runTest('Create Project', async (client) => {
    const result = await client.createProject(
      `Smoke Test Project ${Date.now()}`,
      'Automated smoke test project'
    );
    // Response structure: { project, flow }
    testProjectId = result.project?.id;
    if (!testProjectId) throw new Error(`No project ID returned: ${JSON.stringify(result)}`);
  });

  await runTest('List Projects', async (client) => {
    const projects = await client.listProjects();
    if (!Array.isArray(projects)) throw new Error('Projects not an array');
    const found = projects.find(p => p.id === testProjectId);
    if (!found) throw new Error('Created project not in list');
  });

  // Test 4: Flow CRUD
  let testFlowId = null;
  await runTest('Create Flow', async (client) => {
    const result = await client.createFlow(testProjectId, {
      name: `Smoke Test Flow ${Date.now()}`,
      type: 'main',
      nodes: [
        {
          id: 'node-1',
          type: 'launch_browser',
          position: { x: 100, y: 100 },
          data: { label: 'Launch Browser', configuration: { url: 'https://example.com', headless: true } }
        },
        {
          id: 'node-2',
          type: 'close_browser',
          position: { x: 300, y: 100 },
          data: { label: 'Close Browser' }
        }
      ],
      edges: [
        { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'default' }
      ]
    });
    // Response structure: { flow, project }
    testFlowId = result.flow?.id;
    if (!testFlowId) throw new Error(`No flow ID returned: ${JSON.stringify(result)}`);
  });

  await runTest('Get Flow', async (client) => {
    const flow = await client.getFlow(testProjectId, testFlowId);
    if (flow.id !== testFlowId) throw new Error('Flow ID mismatch');
  });

  // Test 5: Flow Execution (Headless Remote Run)
  await runTest('Execute Flow (Headless Remote)', async (client) => {
    console.log('   Starting flow execution...');
    const execution = await client.executeFlow(testProjectId, testFlowId, {
      headless: true,
      timeout: 120000,
    });
    
    if (!execution.runId) throw new Error('No run ID returned');
    console.log(`   Run ID: ${execution.runId}`);
    
    // Poll for completion (max 120 seconds)
    const runResult = await client.waitForRunCompletion(execution.runId, 120000);
    console.log(`   Final status: ${runResult.status}`);
    
    if (runResult.status === 'failed') {
      const errors = runResult.steps?.filter(s => s.status === 'failed');
      throw new Error(`Flow execution failed: ${JSON.stringify(errors)}`);
    }
    if (runResult.status !== 'completed') {
      throw new Error(`Flow did not complete. Status: ${runResult.status}`);
    }
  });

  // Test 6: Playwright Browser Availability
  await runTest('Playwright Browser Launch', async (client) => {
    const response = await client.request('/api/doctor');
    const data = await response.json();
    if (!data.ok) throw new Error('Doctor check failed');
    if (!data.versionSupported) throw new Error('Playwright version not supported for OS');
    if (!data.browsers.chromium) throw new Error('Chromium not installed');
  });

  // Test 7: API Endpoints
  await runTest('API Documentation', async (client) => {
    const response = await client.request('/api/docs');
    if (response.status !== 200) {
      throw new Error(`Swagger docs returned ${response.status}`);
    }
  });

  await runTest('WebSocket Endpoint', async (client) => {
    const response = await client.request('/socket.io/?EIO=4&transport=polling');
    if (response.status !== 200 && response.status !== 400) {
      throw new Error(`Socket.io returned ${response.status}`);
    }
  });

  // Test 8: Cleanup
  await runTest('Cleanup Test Project', async (client) => {
    // Note: Delete endpoint might not exist, so this is best effort
    try {
      const response = await client.request(`/api/projects/${testProjectId}`, {
        method: 'DELETE',
      });
      if (response.status !== 200 && response.status !== 204 && response.status !== 404) {
        console.log(`   (Delete returned ${response.status} - may be expected)`);
      }
    } catch (e) {
      console.log(`   (Cleanup skipped: ${e.message})`);
    }
  });

  // Summary
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n❌ Failed tests:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  }
  
  console.log('\n✅ All functional smoke tests passed!');
}

runFunctionalTests().catch(error => {
  console.error('❌ Functional smoke test runner failed:', error);
  process.exit(1);
});