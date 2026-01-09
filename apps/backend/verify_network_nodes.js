import {
    launchBrowserAction,
    closeBrowserAction,
    interceptRequestAction,
    mockResponseAction,
    waitForResponseAction,
    setNetworkConditionsAction,
    clearAllMocksAction,
    executeJsAction,
    openUrlAction,
    manageTabsAction,
} from './controllers/action.controller.js';
import { browserService } from './services/browser.service.js';

// ==========================================
// MOCK UTILITIES (Unchanged)
// ==========================================

const mockReq = (body = {}) => ({
    body,
    t: (key, params) => key + (params ? ' ' + JSON.stringify(params) : ''), // Mock content translation
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

// Wrapper to execute action and return the result data
const runAction = async (name, actionFn, body) => {
    console.log(`\n⏳ Running ${name}...`);
    const req = mockReq(body);
    const res = mockRes();

    try {
        await actionFn(req, res);
    } catch (error) {
        console.error(`❌ Action ${name} threw error:`, error);
        return { success: false, error: error.message };
    }

    if (res.data && res.data.success) {
        console.log(`✅ ${name} Success:`, res.data.message);
        return res.data;
    } else {
        console.error(`❌ ${name} Failed:`, res.data);
        return res.data;
    }
};

// ==========================================
// TEST SCENARIO
// ==========================================

async function verifyNetworkNodes() {
    console.log('🚀 Starting Network Nodes Verification...');
    let browserId = null;

    try {
        // 1. Launch Browser
        const launchResult = await runAction('launch_browser', launchBrowserAction, {
            headless: true,
            browserType: 'chromium',
        });

        if (!launchResult || !launchResult.success) throw new Error('Failed to launch browser');
        browserId = launchResult.browserId;
        console.log(`ℹ️ Browser ID: ${browserId}`);

        // 2. Open Page (MUST be before intercept/mock to create context)
        await runAction('open_url', openUrlAction, {
            browserId,
            url: 'about:blank',
        });

        // 2.5 Verify State
        await runAction('manage_tabs', manageTabsAction, {
            browserId,
            action: 'list',
        });

        // 3. Mock Test (Intercept + Mock)
        console.log('\n--- 🧪 TEST 1: Request Mocking ---');

        // Define intercept
        await runAction('intercept_request', interceptRequestAction, {
            browserId,
            urlPattern: '**/api/mock-test',
            action: 'mock',
            responseMock: { success: true, mocked: true, message: 'Hello from Mock' },
        });

        await runAction('mock_response', mockResponseAction, {
            browserId,
            urlPattern: '**/api/mock-specific',
            status: 201,
            responseBody: { specific: true },
            headers: JSON.stringify({
                'X-Custom-Header': 'HalTest',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'X-Custom-Header',
            }),
        });

        // Trigger request
        const execResult = await runAction('execute_js', executeJsAction, {
            browserId,
            script: `
                (async () => {
                    try {
                        const r1 = await fetch('https://example.com/api/mock-test').then(r => r.json());
                        const r2 = await fetch('https://example.com/api/mock-specific');
                        const r2Json = await r2.json();
                        return { r1, r2: { status: r2.status, headers: r2.headers.get('x-custom-header'), body: r2Json } };
                    } catch(e) {
                         return { error: e.toString() };
                    }
                })()
            `,
            returnValue: true,
        });

        const result =
            execResult.data && execResult.data.result
                ? execResult.data.result
                : { error: 'No result returned' };
        console.log('🔍 Exec Result:', result);

        if (result.error) {
            console.error('❌ JS Execution Error:', result.error);
        } else {
            const { r1, r2 } = result;

            // ASSERTIONS
            if (r1.mocked === true && r1.message === 'Hello from Mock') {
                console.log('✅ Intercept Request (Mock Action) Verified');
            } else {
                console.error('❌ Intercept Request Failed', r1);
            }

            if (r2.status === 201 && r2.headers === 'HalTest' && r2.body.specific === true) {
                console.log('✅ Mock Response Node Verified');
            } else {
                console.error('❌ Mock Response Failed', r2);
            }
        }

        // 4. Wait For Response Test
        console.log('\n--- 🧪 TEST 2: Wait For Response ---');

        // Waiter setup (must be running before response arrives ideally, but Playwright catches if already in process? No, waitForResponse catches FUTURE responses usually)
        // However, since we are doing sequential await, we need to:
        // 1. Setup Mock
        // 2. Start Action that triggers request (WITHOUT awaiting completion)
        // 3. Await waitForResponse
        // But runAction is async await. We need to cheat.

        await runAction('mock_response', mockResponseAction, {
            browserId,
            urlPattern: '**/api/delayed-response',
            responseBody: { delayed: true },
        });

        // We use execute_js to set a timeout, so we have time to call wait_for_response
        // The fetch happens after 1000ms.
        // We call execute_js and await it (it returns immediately because it just sets timeout? No, execute_js waits for promise if returned)
        // So we should NOT return the promise from inside execute_js if we want it to run in background?
        // Actually, easiest way: use execute_js to triggering fetch in 2s.
        // Then immediately call wait_for_response with 30s timeout.

        await runAction('execute_js', executeJsAction, {
            browserId,
            script: `setTimeout(() => fetch('https://example.com/api/delayed-response'), 1000);`,
            returnValue: true,
        });

        const waitResult = await runAction('wait_for_response', waitForResponseAction, {
            browserId,
            urlPattern: '**/api/delayed-response',
            timeout: 5000,
            saveToVariable: 'capturedResponse',
        });

        if (waitResult.success) {
            console.log('✅ Wait For Response Verified');
        } else {
            console.error('❌ Wait For Response Failed', waitResult);
        }

        // 5. Test Network Conditions (Offline)
        console.log('\n--- 🧪 TEST 3: Offline Mode ---');

        await runAction('set_network_conditions', setNetworkConditionsAction, {
            browserId,
            profile: 'Offline',
        });

        // Try to fetch - expect error
        const offlineResult = await runAction('execute_js', executeJsAction, {
            browserId,
            script: `
                fetch('https://google.com').then(() => 'success').catch(e => 'error: ' + e.message);
            `,
            returnValue: true,
        });

        if (offlineResult.data.result && offlineResult.data.result.startsWith('error')) {
            console.log('✅ Offline Mode Verified (Fetch failed as expected)');
        } else {
            console.error('❌ Offline Mode Failed (Fetch succeeded?)', offlineResult.data?.result);
        }

        // Reset
        await runAction('set_network_conditions', setNetworkConditionsAction, {
            browserId,
            profile: 'No throttling',
        });

        // 6. Cleanup
        console.log('\n--- 🧹 Cleanup ---');
        await runAction('clear_all_mocks', clearAllMocksAction, { browserId });
        await runAction('close_browser', closeBrowserAction, { browserId });

        console.log('\n🎉 Verification Complete!');
    } catch (err) {
        console.error('\n❌ CRITICAL ERROR:', err);
        // Force cleanup
        if (browserId) {
            browserService.delete(browserId).catch(() => {});
        }
    }
}

// Run the verification
verifyNetworkNodes();
