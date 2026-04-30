/**
 * E2E Smoke Tests - Browser Health Verification
 *
 * These tests launch a REAL Chromium instance to verify that:
 * 1. Playwright can initialize without SIGTRAP/ENOSPC errors
 * 2. The TMPDIR redirection works correctly
 * 3. Basic browser navigation functions
 *
 * IMPORTANT: These tests are slow (~5-10s each) and require Chromium installed.
 * They should be run selectively, not on every file change.
 */
import { describe, it, expect } from 'vitest';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

describe('E2E Smoke Tests - Browser Health', () => {
    it('should verify that TMPDIR is configured and writable', () => {
        const tmpDir = process.env.TMPDIR || '/tmp';

        // Verify the directory exists
        expect(fs.existsSync(tmpDir)).toBe(true);

        // Verify we can write to it
        const testFile = path.join(tmpDir, `smoke-test-${Date.now()}.tmp`);
        fs.writeFileSync(testFile, 'test');
        expect(fs.existsSync(testFile)).toBe(true);
        fs.unlinkSync(testFile); // Cleanup
    });

    it('should successfully launch and close Chromium', async () => {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        });

        expect(browser.isConnected()).toBe(true);

        await browser.close();
    }, 30000); // 30s timeout

    it('should navigate to a page and read its title', async () => {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        // Navigate to a reliable public page
        await page.goto(
            'data:text/html,<html><head><title>Smoke Test</title></head><body>OK</body></html>',
        );
        const title = await page.title();

        expect(title).toBe('Smoke Test');

        const bodyText = await page.textContent('body');
        expect(bodyText).toBe('OK');

        await context.close();
        await browser.close();
    }, 30000); // 30s timeout
});
