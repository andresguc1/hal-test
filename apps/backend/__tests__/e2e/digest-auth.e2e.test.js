/**
 * E2E Tests - HTTP Digest Authentication
 *
 * These tests verify that Haltest's httpCredentials configuration works
 * correctly with HTTP Digest Authentication (RFC 7616).
 *
 * The reference site https://the-internet.herokuapp.com/digest_auth uses
 * Digest Auth with credentials admin/admin.
 *
 * IMPORTANT: These tests launch a REAL Chromium instance and make REAL
 * network requests. They require internet access and the Playwright
 * browser binaries to be installed.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import launchBrowserBodySchema from '../../schemas/launch_browser/body.js';

const DIGEST_AUTH_URL = 'https://the-internet.herokuapp.com/digest_auth';
const VALID_CREDS = { username: 'admin', password: 'admin' };
const WRONG_CREDS = { username: 'wronguser', password: 'wrongpass' };

const browserOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
};

describe('E2E: HTTP Digest Authentication', () => {
    let browser;

    beforeAll(async () => {
        browser = await chromium.launch(browserOptions);
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    }, 10000);

    it('should authenticate successfully with Digest Auth via httpCredentials', async () => {
        const context = await browser.newContext({
            httpCredentials: VALID_CREDS,
        });
        const page = await context.newPage();

        const response = await page.goto(DIGEST_AUTH_URL, { timeout: 15000 });
        expect(response).not.toBeNull();
        expect(response.status()).toBe(200);

        await page.waitForSelector('body', { timeout: 10000 });
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('Congratulations!');

        await context.close();
    }, 30000);

    it('should return 401 when wrong credentials are provided for Digest Auth', async () => {
        const context = await browser.newContext({
            httpCredentials: WRONG_CREDS,
        });
        const page = await context.newPage();

        const response = await page.goto(DIGEST_AUTH_URL, { timeout: 15000 });
        expect(response).not.toBeNull();
        expect(response.status()).toBe(401);

        await context.close();
    }, 30000);

    it('should return 401 when no credentials are provided for Digest Auth', async () => {
        const context = await browser.newContext();
        const page = await context.newPage();

        const response = await page.goto(DIGEST_AUTH_URL, { timeout: 15000 });
        expect(response).not.toBeNull();
        expect(response.status()).toBe(401);

        await context.close();
    }, 30000);

    it('should maintain authentication across multiple navigations', async () => {
        const context = await browser.newContext({
            httpCredentials: VALID_CREDS,
        });
        const page = await context.newPage();

        let response = await page.goto(DIGEST_AUTH_URL, { timeout: 15000 });
        expect(response.status()).toBe(200);

        response = await page.goto(DIGEST_AUTH_URL, { timeout: 15000 });
        expect(response.status()).toBe(200);

        const bodyText = await page.textContent('body');
        expect(bodyText).toContain('Congratulations!');

        await context.close();
    }, 30000);

    it('should validate httpCredentials schema with extended fields', () => {
        const validPayload = {
            browserType: 'chromium',
            httpCredentials: {
                username: 'admin',
                password: 'admin',
                origin: 'https://the-internet.herokuapp.com',
                send: 'unauthorized',
            },
        };
        const { error, value } = launchBrowserBodySchema.validate(validPayload);
        expect(error).toBeUndefined();
        expect(value.httpCredentials.username).toBe('admin');
        expect(value.httpCredentials.password).toBe('admin');
        expect(value.httpCredentials.origin).toBe('https://the-internet.herokuapp.com');
        expect(value.httpCredentials.send).toBe('unauthorized');
    });
});
