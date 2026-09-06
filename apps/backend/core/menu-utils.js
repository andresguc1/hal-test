// core/menu-utils.js - Context menu (right-click) interaction helpers
// ==========================================================
// Robust helpers for interacting with DOM context menus produced by a
// `button: 'right'` click and for simulating click-outside (blur) dismissal.
//
// Two concerns:
//   1. clickContextMenuItem  — resolve a context-menu option from a role-aware
//      locator (getByRole('menuitem', …)) and click it reliably.
//   2. dismissContextMenu  — send a neutral click outside the menu (blur /
//      click-outside simulation) and verify the menu really disappeared.
// ==========================================================

import { buildPlaywrightLocator } from './selector-utils.js';

const MENU_ROLE_KINDS = ['menuitem', 'menuitemcheckbox', 'menuitemradio'];

// Anything the user types as `page.getByRole(...)` / `getByText(...)` etc. is a
// full locator expression and must NOT be treated as a visual text name.
const LOCATOR_EXPRESSION_RE = /^(page\.|getBy)/i;

export function isLocatorExpression(value) {
    return typeof value === 'string' && LOCATOR_EXPRESSION_RE.test(value.trim());
}

/**
 * Builds an ordered list of locator candidates for a context-menu item.
 *  - Locator expressions (page.getByRole(…), getByText(…), CSS) are kept.
 *  - Plain text names are matched role-aware first (menuitem →
 *    menuitemcheckbox → menuitemradio), falling back to a raw DOM locator.
 */
export function buildMenuCandidates(page, raw) {
    const candidates = [];
    if (!raw) return candidates;

    if (isLocatorExpression(raw)) {
        candidates.push({ locator: buildPlaywrightLocator(page, raw.trim()), strategy: 'locator' });
        return candidates;
    }

    for (const role of MENU_ROLE_KINDS) {
        candidates.push({
            locator: page.getByRole(role, { name: raw }).first(),
            strategy: `getByRole('${role}', name)`,
        });
    }

    candidates.push({ locator: buildPlaywrightLocator(page, raw), strategy: 'dom-locator' });
    return candidates;
}

/**
 * Clicks a context-menu item. Prefers role-aware locators; each candidate is
 * gated by a cheap count() check so a wrong role does not burn the full
 * timeout. Fails with a clear 400 error (selector failure) when nothing
 * matches.
 * @returns {Promise<{strategy: string}>} how the item was located.
 */
export async function clickContextMenuItem(page, raw, { timeout, clickOptions } = {}) {
    const candidates = buildMenuCandidates(page, raw);
    if (candidates.length === 0) {
        const error = new Error('contextMenuItem is required to interact with the menu option.');
        error.status = 400;
        throw error;
    }

    let lastError = null;
    for (const candidate of candidates) {
        try {
            const present = await candidate.locator.count();
            if (present === 0) continue;
            await candidate.locator.click({ timeout, ...clickOptions });
            return { strategy: candidate.strategy };
        } catch (err) {
            lastError = err;
        }
    }

    const error = new Error(
        `Failed to click context menu item "${raw}". ` +
            `The right-click opened a menu, but no matching option was found or actionable. ` +
            `Tip: use page.getByRole('menuitem', { name: '…' }) for exact role/name matching.` +
            (lastError?.message ? ` Last attempt: ${lastError.message}` : ''),
    );
    error.status = 400;
    throw error;
}

async function countVisible(page, selector) {
    const locator = page.locator(selector);
    let total = 0;
    try {
        total = await locator.count();
    } catch {
        return 0;
    }
    let visible = 0;
    for (let i = 0; i < total; i++) {
        try {
            if (await locator.nth(i).isVisible()) visible += 1;
        } catch {
            /* detached mid-check — ignore */
        }
    }
    return visible;
}

const DEFAULT_MENU_SELECTOR =
    '[role="menu"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/**
 * Simulates losing focus / clicking outside an open context menu and verifies
 * the menu actually closed (disappeared from the visible DOM).
 *
 * Defaults: neutral click at the top-left corner (4,4) followed by a short
 * settle delay. Set `throwIfOpen: false` to demote the close-verification to a
 * best-effort report instead of a failure.
 *
 * @returns {Promise<{dismissed: boolean, hadMenu: boolean, visibleAfter: number}>}
 */
export async function dismissContextMenu(
    page,
    { x = 4, y = 4, settleMs = 80, menuSelector = DEFAULT_MENU_SELECTOR, throwIfOpen = true } = {},
) {
    const visibleAfter = () => countVisible(page, menuSelector);
    const hadMenu = (await visibleAfter()) > 0;

    // 1. Blur whatever currently holds focus, as a real user tabbing away would.
    await page
        .evaluate(() => {
            /* eslint-disable no-undef */
            const active = document?.activeElement;
            if (active && typeof active.blur === 'function') active.blur();
            if (typeof document?.body?.blur === 'function') document.body.blur();
            /* eslint-enable no-undef */
        })
        .catch(() => {});

    // 2. Neutral click on an empty region (top-left corner).
    await page.mouse.click(x, y);

    // 3. Let the menu's close transition finish.
    if (settleMs > 0) await page.waitForTimeout(settleMs);

    const after = await visibleAfter();

    if (throwIfOpen && hadMenu && after >= hadMenu) {
        const error = new Error(
            'Context menu did not close after clicking outside. It is still visible in the DOM.',
        );
        error.status = 400;
        throw error;
    }

    return { dismissed: hadMenu && after === 0, hadMenu, visibleAfter: after };
}
