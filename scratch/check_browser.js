import { chromium } from 'playwright';

async function run() {
    console.log('--- Playwright Diagnostic Start ---');
    try {
        console.log('Attempting to launch Chromium with --no-sandbox...');
        const browser = await chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-gpu']
        });
        console.log('SUCCESS: Browser launched correctly!');
        const page = await browser.newPage();
        await page.goto('https://google.com');
        console.log('SUCCESS: Page loaded:', await page.title());
        await browser.close();
    } catch (err) {
        console.error('FAILED: Browser crash detected!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Stack Trace:', err.stack);
    }
    console.log('--- Playwright Diagnostic End ---');
}

run();
