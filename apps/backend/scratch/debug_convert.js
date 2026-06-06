import { importService } from '../services/importer/index.js';

const playwrightCode = `
    import { test } from '@playwright/test';
    test('my test name', async ({ page }) => {
        await page.goto('https://google.com');
        await page.click('input[type="submit"]');
        await page.fill('#username', 'my-user');
    });
`;

try {
    const result = importService.convert(playwrightCode, 'playwright');
    console.log('Convert result success:', result.success);
    if (!result.success) {
        console.error('Error details:', result.error);
    } else {
        console.log('Flows:', JSON.stringify(result.flows, null, 2));
    }
} catch (e) {
    console.error('Crash error:', e);
}
