import { test, expect } from '@playwright/test';

test('HalTest demo test', async ({ page }) => {
    // A simple demo test that navigates to a fast website and verifies the title
    await page.goto('https://example.com');
    await expect(page).toHaveTitle(/Example Domain/);

    // Check for a generic element to show it works
    const header = page.locator('h1');
    await expect(header).toHaveText('Example Domain');
});
