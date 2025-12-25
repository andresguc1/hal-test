import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';

test('Login with POM', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.navigateToLogin();
    await loginPage.login('user@example.com', 'password123');
    await expect(page.locator('.welcome-message')).toBeVisible();
});
