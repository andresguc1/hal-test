import {
    launchBrowserAction,
    closeBrowserAction,
    openUrlAction,
    listenEventsAction,
    executeJsAction,
} from './controllers/action.controller.js';
import { browserService } from './services/browser.service.js';
import * as fsp from 'fs/promises';
import * as path from 'path';

// ==========================================
// MOCK UTILITIES
// ==========================================

const mockReq = (body = {}) => ({
    body,
    t: (key, params) => key + (params ? ' ' + JSON.stringify(params) : ''),
    headers: {},
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

async function verifyListenEvents() {
    console.log('🚀 Starting Listen Events Verification...');
    let browserId = null;
    const logPath = path.resolve('./test_events.jsonl');

    try {
        // 1. Cleanup old log
        await fsp.unlink(logPath).catch(() => {});

        // 2. Launch Browser
        const launchResult = await runAction('launch_browser', launchBrowserAction, {
            headless: true,
            browserType: 'chromium',
        });
        browserId = launchResult.browserId;

        // 3. Open Test Page
        await runAction('open_url', openUrlAction, {
            browserId,
            url: 'https://example.com',
        });

        // 4. Start Listening for Clicks (DOM)
        await runAction('listen_events', listenEventsAction, {
            browserId,
            eventType: 'click',
            logToFile: true,
            filePath: logPath,
            nodeId: 'test_node_click',
        });

        // 5. Start Listening for Requests (Network) with Filter
        console.log(
            '\n📡 Starting filtered network listener (Pattern: **/api/test, Method: GET)...',
        );
        await runAction('listen_events', listenEventsAction, {
            browserId,
            eventType: 'request',
            urlPattern: '**/api/test',
            method: 'GET',
            logToFile: true,
            filePath: logPath,
            nodeId: 'test_node_request_filtered',
        });

        // 6. Trigger a click via JS
        console.log('\n🖱️ Triggering click event...');
        await runAction('execute_js', executeJsAction, {
            browserId,
            script: `document.body.click();`,
        });

        // 7. Trigger a MATCHING network request via JS
        console.log('\n🌐 Triggering MATCHING network request (GET **/api/test)...');
        await runAction('execute_js', executeJsAction, {
            browserId,
            script: `fetch('https://example.com/api/test');`,
        });

        // 7.1 Trigger a NON-MATCHING network request via JS
        console.log('\n🌐 Triggering NON-MATCHING network request (POST **/api/other)...');
        await runAction('execute_js', executeJsAction, {
            browserId,
            script: `fetch('https://example.com/api/other', { method: 'POST' });`,
        });

        // 8. Wait a bit for async logging
        console.log('\nWaiting for logs to persist...');
        await new Promise((r) => setTimeout(r, 2000));

        // 9. Verify File
        const stats = await fsp.stat(logPath);
        if (stats.size > 0) {
            const content = await fsp.readFile(logPath, 'utf-8');
            console.log('\n📄 Log File Content:');
            console.log(content);
            console.log(`✅ Log file verified (${stats.size} bytes)`);
        } else {
            throw new Error('Log file is empty');
        }

        // 10. Cleanup
        await runAction('close_browser', closeBrowserAction, { browserId });
        await fsp.unlink(logPath).catch(() => {});

        console.log('\n🎉 Listen Events Verification Complete!');
    } catch (err) {
        console.error('\n❌ CRITICAL ERROR:', err);
        if (browserId) browserService.delete(browserId).catch(() => {});
    }
}

verifyListenEvents();
