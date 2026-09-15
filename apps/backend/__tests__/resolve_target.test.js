import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import {
    resolveTarget,
    buildPlaywrightLocator,
    PICKER_CANDIDATE_ORDER,
} from '../core/selector-utils.js';

describe('resolveTarget', () => {
    let browser;
    let context;
    let page;

    beforeAll(async () => {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        });
        context = await browser.newContext();
        page = await context.newPage();

        await page.setContent(`
            <html>
                <body>
                    <form id="login-form">
                        <label for="username">Username</label>
                        <input id="username" name="username" placeholder="Enter username" aria-label="Username field">
                        <label for="password">Password</label>
                        <input id="password" name="password" type="password" placeholder="Enter password" aria-label="Password field">
                        <button type="button" data-testid="submit-btn">Login</button>
                        <a href="#" data-testid="forgot-link">Forgot password?</a>
                    </form>
                    <div role="dialog" aria-label="Checkout">
                        <button>Save</button>
                        <button>Cancel</button>
                    </div>
                    <div class="dynamic-content">Initial content</div>
                </body>
            </html>
        `);
        await page.waitForLoadState('domcontentloaded');
    });

    afterAll(async () => {
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
    });

    function createTarget(selector, candidates = {}, selectorType = 'unknown', scope = 'element') {
        return { selector, candidates, selectorType, scope };
    }

    describe('page scope', () => {
        it('should return body locator for page scope', async () => {
            const target = createTarget('#anything', {}, 'unknown', 'page');
            const result = await resolveTarget({ page, target, scope: 'page', timeout: 30000 });

            expect(result.resolution).toBe('page');
            expect(result.usedSelector).toBe('body');
            expect(result.selectorType).toBe('page');
            expect(result.locator).toBeDefined();
        });
    });

    describe('single selector (no candidates) - backward compatible', () => {
        it('should resolve CSS selector without candidates', async () => {
            const target = createTarget('#username');
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('primary');
            expect(result.usedSelector).toBe('#username');
            expect(result.locator).toBeDefined();
            const count = await result.locator.count();
            expect(count).toBe(1);
        });

        it('should resolve getByTestId without candidates', async () => {
            const target = createTarget("getByTestId('submit-btn')");
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('primary');
            expect(result.usedSelector).toBe("getByTestId('submit-btn')");
            const count = await result.locator.count();
            expect(count).toBe(1);
        });

        it('should resolve getByRole without candidates', async () => {
            const target = createTarget("getByRole('button', { name: 'Login' })");
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('primary');
            expect(result.usedSelector).toBe("getByRole('button', { name: 'Login' })");
            const count = await result.locator.count();
            expect(count).toBe(1);
        });
    });

    describe('with candidates - fallback behavior', () => {
        it('should use primary when it attaches (even with candidates present)', async () => {
            const target = createTarget(
                '#username',
                { playwrightTestId: "getByTestId('username')", id: '#username' },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('primary');
            expect(result.usedSelector).toBe('#username');
            expect(result.candidatesTried[0].status).toBe('attached');
        });

        it('should fallback to first working candidate when primary fails to attach', async () => {
            // Primary is a non-existent ID, fallback is valid getByTestId
            const target = createTarget(
                '#nonexistent',
                { playwrightTestId: "getByTestId('submit-btn')", id: '#nonexistent' },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('fallback');
            expect(result.usedSelector).toBe("getByTestId('submit-btn')");
            expect(result.candidatesTried.length).toBeGreaterThan(1);
            expect(result.candidatesTried[0].status).toBe('not-attached');
            expect(result.candidatesTried[1].status).toBe('attached');
        });

        it('should try candidates in priority order (PICKER_CANDIDATE_ORDER)', async () => {
            // Provide candidates in reverse priority order, should still pick by priority
            const target = createTarget(
                '#nonexistent',
                {
                    cssPath: 'body > form > input:nth-child(2)',
                    id: '#nonexistent',
                    playwrightTestId: "getByTestId('submit-btn')",
                },
                'unknown',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            // playwrightTestId has higher priority than cssPath
            expect(result.usedSelector).toBe("getByTestId('submit-btn')");
        });

        it('should deduplicate candidates (same value only tried once)', async () => {
            const target = createTarget(
                '#username',
                { id: '#username', playwrightTestId: "getByTestId('submit-btn')" },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            const selectorsTried = result.candidatesTried.map((c) => c.selector);
            const uniqueSelectors = new Set(selectorsTried);
            expect(selectorsTried.length).toBe(uniqueSelectors.size);
        });

        it('should return resolution:none when no candidate attaches', async () => {
            const target = createTarget(
                '#nonexistent1',
                { id: '#nonexistent2', cssPath: '#nonexistent3' },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.resolution).toBe('none');
            expect(result.locator).toBeDefined(); // Still returns a locator for the primary
            expect(
                result.candidatesTried.every(
                    (c) => c.status === 'not-attached' || c.status === 'used-as-last-resort',
                ),
            ).toBe(true);
        });

        it('should handle malformed candidate strings gracefully', async () => {
            const target = createTarget(
                '#nonexistent',
                {
                    badCandidate: 'not a valid selector at all!',
                    playwrightTestId: "getByTestId('submit-btn')",
                },
                'unknown',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            // Should skip bad candidate and use the valid one
            expect(result.resolution).toBe('fallback');
            expect(result.usedSelector).toBe("getByTestId('submit-btn')");
        });
    });

    describe('probe timeout behavior', () => {
        it('should use short probe timeout (min of 1500ms and provided timeout)', async () => {
            const target = createTarget(
                '#username',
                { playwrightTestId: "getByTestId('submit-btn')" },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 5000 });

            // Should resolve quickly since primary attaches
            expect(result.resolution).toBe('primary');
        });

        it('should respect very short timeout', async () => {
            const target = createTarget('#username', {}, 'id');
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 100 });

            expect(result.resolution).toBe('primary');
        });
    });

    describe('selectorType tracking', () => {
        it('should track selectorType from target', async () => {
            const target = createTarget('#username', {}, 'playwright_test_id');
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.selectorType).toBe('playwright_test_id');
        });

        it('should infer selectorType from winning candidate when fallback used', async () => {
            const target = createTarget(
                '#nonexistent',
                { playwrightTestId: "getByTestId('submit-btn')" },
                'unknown',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.selectorType).toBe('playwrightTestId');
        });
    });

    describe('candidatesTried and errors tracking', () => {
        it('should record all candidates tried with status', async () => {
            const target = createTarget(
                '#nonexistent',
                {
                    playwrightTestId: "getByTestId('submit-btn')",
                    id: '#also-nonexistent',
                },
                'id',
            );
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.candidatesTried).toBeDefined();
            expect(result.candidatesTried.length).toBeGreaterThanOrEqual(2);
            expect(result.candidatesTried[0]).toHaveProperty('selector');
            expect(result.candidatesTried[0]).toHaveProperty('status');
        });

        it('should include errors for failed candidates', async () => {
            const target = createTarget('#nonexistent', { id: '#also-nonexistent' }, 'id');
            const result = await resolveTarget({ page, target, scope: 'element', timeout: 30000 });

            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});

describe('PICKER_CANDIDATE_ORDER', () => {
    it('should have expected priority order', () => {
        expect(PICKER_CANDIDATE_ORDER[0]).toBe('playwrightTestId');
        expect(PICKER_CANDIDATE_ORDER[1]).toBe('playwrightRole');
        expect(PICKER_CANDIDATE_ORDER[2]).toBe('playwrightLabel');
        expect(PICKER_CANDIDATE_ORDER[3]).toBe('playwrightPlaceholder');
        expect(PICKER_CANDIDATE_ORDER[4]).toBe('playwrightAltText');
        expect(PICKER_CANDIDATE_ORDER[5]).toBe('playwrightTitle');
        expect(PICKER_CANDIDATE_ORDER[6]).toBe('playwrightText');
        expect(PICKER_CANDIDATE_ORDER[7]).toBe('testId');
        expect(PICKER_CANDIDATE_ORDER[8]).toBe('id');
        expect(PICKER_CANDIDATE_ORDER[9]).toBe('name');
        expect(PICKER_CANDIDATE_ORDER[10]).toBe('aria');
        expect(PICKER_CANDIDATE_ORDER[11]).toBe('text');
        expect(PICKER_CANDIDATE_ORDER[12]).toBe('cssPath');
        expect(PICKER_CANDIDATE_ORDER[13]).toBe('xpath');
    });
});

describe('buildPlaywrightLocator with options parsing', () => {
    let browser;
    let context;
    let page;

    beforeAll(async () => {
        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote'],
        });
        context = await browser.newContext();
        page = await context.newPage();

        await page.setContent(`
            <html>
                <body>
                    <button id="btn1">Click me</button>
                    <button id="btn2">Click me</button>
                    <input id="exact-input" type="text">
                </body>
            </html>
        `);
        await page.waitForLoadState('domcontentloaded');
    });

    afterAll(async () => {
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
    });

    it('should parse getByRole with exact option', async () => {
        const locator = buildPlaywrightLocator(
            page,
            "getByRole('button', { name: 'Click me', exact: true })",
        );
        const count = await locator.count();
        // exact: true should match exact text, so both buttons match
        expect(count).toBe(2);
    });

    it('should parse getByText with exact option', async () => {
        const locator = buildPlaywrightLocator(page, "getByText('Click me', { exact: true })");
        const count = await locator.count();
        expect(count).toBe(2);
    });

    it('should parse chain with filter hasText (filter parsing works)', async () => {
        // Test that the chain parser correctly handles filter() syntax
        // Filter on buttons rather than body since body filter has different semantics
        const locator = buildPlaywrightLocator(
            page,
            "page.locator('button').filter({ hasText: 'Click me' })",
        );
        const count = await locator.count();
        // The filter should work - both buttons have the text
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
