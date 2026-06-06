import { PlaywrightParser } from '../services/importer/playwright/PlaywrightParser.js';

const playwrightCode = `
    import { test } from '@playwright/test';
    test('my test name', async ({ page }) => {
        await page.goto('https://google.com');
        await page.click('input[type="submit"]');
        await page.fill('#username', 'my-user');
    });
`;

try {
    const parser = new PlaywrightParser();
    const tests = parser.parse(playwrightCode);
    console.log('Result tests:', tests);
} catch (e) {
    console.error('Error:', e);
}
