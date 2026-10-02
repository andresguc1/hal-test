import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';
import { TextStrategy } from '../../plugins/core-assertion/engine/strategies/TextStrategy.js';
import { resolveTarget } from '../../core/selector-utils.js';

/* global document */
/**
 * End-to-end regression for the EntryAd-style modal reported in the
 * assertion-locator task.
 *
 * Reproduces the exact DOM shape reported (a `#modal` whose second child div
 * holds heading + description + close link) using a local `data:` fixture so
 * the test is deterministic and network-free. The heading text is read from the
 * DOM, so no modal copy is hard-coded in the expectations.
 *
 * Verifies:
 *  - Equals targets the heading locator and passes (exact, web-first).
 *  - Web-first retry: Equals passes when the heading text updates a few
 *    hundred ms after the assertion starts.
 *  - Contains passes on the container the way the reporter expected.
 *  - Equals behaves like Cypress `.contains()`: the expected text passes when
 *    it exists as a part of (or the whole) container text, and fails when it
 *    is absent, reporting the operator and the full visible text.
 *  - Locator priority: a Playwright getByRole candidate beats CSS/XPath.
 */

const MODAL_FIXTURE = `data:text/html,<html><body>
<div id="modal" role="dialog" aria-modal="true">
  <div class="modal-overlay"></div>
  <div class="modal-content">
    <h3>This is a modal window</h3>
    <p>It is common in web design to use modals for interstitial content.</p>
    <div class="modal-footer"><a href="#" class="modal-close">Close</a></div>
  </div>
</div>
</body></html>`;

describe('EntryAd modal text assertion regression (e2e, real browser)', () => {
    let browser;
    let context;
    let page;
    let titleText;

    const CONTAINER = '#modal > div:nth-of-type(2)';
    const HEADING = '#modal h3';

    const execute = async (locator, assertion, timeout = 8000) =>
        new TextStrategy().execute(page, locator, assertion, { timeout });

    beforeAll(async () => {
        browser = await chromium.launch({ headless: true });
        context = await browser.newContext();
        page = await context.newPage();
        await page.goto(MODAL_FIXTURE);
        await page.waitForSelector(CONTAINER, { state: 'visible', timeout: 10000 });
        // Read the real copy from the DOM so expectations never hard-code it.
        titleText = (await page.locator(HEADING).innerText()).trim();
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it('resolves a target and Equals passes against the heading', async () => {
        const resolution = await resolveTarget({
            page,
            target: { selector: HEADING, scope: 'element' },
            scope: 'element',
            timeout: 8000,
        });
        expect(resolution.resolution).not.toBe('none');
        const result = await execute(resolution.locator, {
            operator: 'equals',
            expected: titleText,
        });
        expect(result.passed).toBe(true);
    }, 20000);

    it('Equals passes once the heading text updates after the assertion starts (web-first retry)', async () => {
        const updatedText = 'MODAL TITLE UPDATED';
        // Kick off a delayed text mutation in the page; do not await yet.
        const pendingMutation = page.evaluate((newText) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    document.querySelector('#modal h3').textContent = newText;
                    resolve();
                }, 400);
            });
        }, updatedText);

        const resolution = await resolveTarget({
            page,
            target: { selector: HEADING, scope: 'element' },
            scope: 'element',
            timeout: 8000,
        });
        const result = await execute(
            resolution.locator,
            { operator: 'equals', expected: updatedText, caseSensitive: false },
            6000,
        );
        await pendingMutation;
        expect(result.passed).toBe(true);
        // Restore the heading so later tests observe the original copy.
        await page.evaluate((original) => {
            document.querySelector('#modal h3').textContent = original;
        }, titleText);
    }, 20000);

    it('Contains passes on the container div', async () => {
        const resolution = await resolveTarget({
            page,
            target: { selector: CONTAINER, scope: 'element' },
            scope: 'element',
            timeout: 8000,
        });
        expect(resolution.resolution).not.toBe('none');
        const result = await execute(resolution.locator, {
            operator: 'contains',
            expected: titleText,
        });
        expect(result.passed).toBe(true);
    }, 20000);

    it('Equals matches the title inside the container text (Cypress contains)', async () => {
        // The container exposes title + description + close link; the expected
        // title exists as a part of that text, so Equals must pass.
        const resolution = await resolveTarget({
            page,
            target: { selector: CONTAINER, scope: 'element' },
            scope: 'element',
            timeout: 8000,
        });
        const result = await execute(
            resolution.locator,
            {
                operator: 'equals',
                expected: titleText,
                caseSensitive: false,
            },
            8000,
        );
        expect(result.passed).toBe(true);
        expect(result.operator).toBe('equals');
        expect(result.actual).toContain(titleText);
    }, 20000);

    it('Equals fails when the expected text is absent, with diagnostics', async () => {
        const resolution = await resolveTarget({
            page,
            target: { selector: CONTAINER, scope: 'element' },
            scope: 'element',
            timeout: 5000,
        });
        const result = await execute(
            resolution.locator,
            {
                operator: 'equals',
                expected: 'TEXT THAT DOES NOT EXIST ANYWHERE',
                caseSensitive: false,
            },
            1500,
        );
        expect(result.passed).toBe(false);
        expect(result.operator).toBe('equals');
        expect(result.message).toContain('to contain');
    }, 20000);

    it('preserves Playwright locator priority when the picker stored it as primary', async () => {
        // Mirrors the module picker store: `pickBestSelector` ranks the
        // getByRole selector highest and persists it as `target.selector`,
        // with CSS/XPath kept only as lower-priority candidates.
        const roleSelector = `getByRole('heading', { name: '${titleText}' })`;
        const resolution = await resolveTarget({
            page,
            target: {
                selector: roleSelector,
                scope: 'element',
                selectorType: 'playwrightRole',
                candidates: {
                    playwrightRole: roleSelector,
                    cssPath: CONTAINER,
                },
            },
            scope: 'element',
            timeout: 8000,
        });
        expect(resolution.resolution).not.toBe('none');
        expect(resolution.selectorType).toBe('playwrightRole');
        expect(resolution.usedSelector).toContain('getByRole');
    }, 20000);

    it('uses the primary (even when lower priority) if it attaches — fallback design', async () => {
        // Legacy/persisted configs: when the stored primary attaches, it wins;
        // higher-priority candidates serve as fallbacks only.
        const roleSelector = `getByRole('heading', { name: '${titleText}' })`;
        const resolution = await resolveTarget({
            page,
            target: {
                selector: CONTAINER,
                scope: 'element',
                selectorType: 'cssPath',
                candidates: {
                    playwrightRole: roleSelector,
                    cssPath: CONTAINER,
                },
            },
            scope: 'element',
            timeout: 8000,
        });
        expect(resolution.resolution).toBe('primary');
        expect(resolution.usedSelector).toBe(CONTAINER);
    }, 20000);
});
