import { test, expect } from '@playwright/test';

test('Login Test', async ({ page }) => {
    await page.goto('https://example.com');
    await page.click('#login-button');
    await page.fill('#username', 'testuser');
    await page.fill('#password', 'password123');
    await page.click('#submit');
    await expect(page.locator('.welcome')).toBeVisible();
});
