// apps/backend/verify_wait_navigation.js
import {
    launchBrowserAction,
    openUrlAction,
    waitNavigationAction,
    closeBrowserAction,
} from './controllers/action.controller.js';
import { browserService } from './services/browser.service.js';

async function runAction(name, action, opts) {
    const req = {
        body: opts,
        t: (key) => key,
        app: { get: () => ({ emit: () => {} }) }, // Mock socket
    };
    const res = {
        status: (code) => ({ json: (data) => ({ code, data }) }),
        json: (data) => ({ code: 200, data }),
    };
    console.log(`\n⏳ Running ${name}...`);
    const result = await action(req, res);
    if (result.data && result.data.success === false) {
        throw new Error(result.data.error || 'Action failed');
    }
    console.log(
        `✅ ${name} Success:`,
        result.data?.data?.message || result.data?.message || 'Done',
    );
    return result;
}

async function verify() {
    let browserId;
    try {
        // 1. Launch Browser
        const launchResult = await runAction('launch_browser', launchBrowserAction, {
            headless: true,
        });
        browserId = launchResult.data.browserId;

        // 2. Open initial page
        await runAction('open_url', openUrlAction, {
            browserId,
            url: 'https://example.com',
        });

        // 3. Test Wait Navigation (Load)
        console.log('\n🔵 Testing generic wait (load)...');
        await runAction('wait_navigation', waitNavigationAction, {
            browserId,
            waitUntil: 'load',
            timeout: 5000,
        });

        // 4. Test Wait Navigation (URL Pattern)
        console.log('\n🟢 Testing URL pattern wait (https://example.com/)...');
        await runAction('wait_navigation', waitNavigationAction, {
            browserId,
            url: 'https://example.com/',
            waitUntil: 'domcontentloaded',
            timeout: 5000,
        });

        // 5. Test Invalid state (should fail)
        console.log('\n🔴 Testing invalid state (should fail)...');
        try {
            await runAction('wait_navigation', waitNavigationAction, {
                browserId,
                waitUntil: 'invalid_state',
            });
            console.error('❌ Failed: Should have thrown an error for invalid state');
        } catch (err) {
            console.log('✅ Success: Caught expected error:', err.message);
        }

        // 6. Cleanup
        await runAction('close_browser', closeBrowserAction, { browserId });

        console.log('\n🎉 Wait Navigation Verification Complete!');
    } catch (err) {
        console.error('\n❌ Verification failed:', err.message);
        if (browserId) await browserService.delete(browserId).catch(() => {});
    }
}

verify();
