/**
 * CustomDropdown
 *
 * Shared helpers for interacting with NON-native `<select>` elements (custom
 * div/button-based dropdowns). `selectOption()` only works on native `<select>`,
 * so when a dropdown was classified as native but the resolved element is a
 * custom component, these helpers open the trigger and click the option by its
 * label/text instead.
 */

import { buildPlaywrightLocator } from '../../core/selector-utils.js';

export const CUSTOM_OPTION_SELECTORS =
    '[role="option"], [role="menuitem"], li, div[data-option], .option-item, .dropdown-item';

/**
 * Determines whether a resolved locator points to a native `<select>` element
 * or an `<option>` inside a native `<select>`.
 * Any resolution/attach failure is treated as "not native" so callers can fall
 * back to the click-based flow instead of timing out in selectOption().
 *
 * @param {import('playwright').Locator} locator
 * @returns {Promise<boolean>}
 */
export async function isNativeSelectElement(locator) {
    try {
        const tag = await locator.evaluate((el) => el.tagName, null, { timeout: 3000 });
        if (tag === 'SELECT') return true;
        // If it's an OPTION, check if it's inside a native SELECT
        if (tag === 'OPTION') {
            const parentSelect = await locator.locator('xpath=ancestor::select').first();
            const count = await parentSelect.count();
            return count > 0;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Opens a custom dropdown by clicking its trigger/container (best effort).
 * Waits for the menu to be fully expanded and options to be present.
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {number} timeout
 */
export async function openDropdownMenu(page, containerSelector, timeout = 30000) {
    if (!containerSelector) return;
    try {
        const trigger = buildPlaywrightLocator(page, containerSelector).first();
        await trigger.waitFor({ state: 'attached', timeout: Math.min(timeout, 5000) });
        const readExpanded =
            typeof trigger.getAttribute === 'function'
                ? await trigger.getAttribute('aria-expanded').catch(() => 'false')
                : 'false';
        if (readExpanded !== 'true') {
            await trigger.click({ timeout: Math.min(timeout, 5000) });
            // Wait for menu to expand and options to appear in DOM
            await waitForMenuReady(page, containerSelector, timeout);
        }
    } catch (err) {
        console.warn(`[CustomDropdown] Open failed (${err.message}); continuing.`);
    }
}

/**
 * Waits for a custom dropdown menu to be fully open and options to be present.
 * Tries multiple strategies: aria-expanded, visible role=option items, portal detection.
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {number} timeout
 */
async function waitForMenuReady(page, containerSelector, timeout = 30000) {
    const startTime = Date.now();
    const maxWait = Math.min(timeout, 10000); // Cap at 10s for menu open

    while (Date.now() - startTime < maxWait) {
        try {
            // Strategy 1: Check aria-expanded on trigger
            const trigger = buildPlaywrightLocator(page, containerSelector).first();
            const expanded = await trigger.getAttribute('aria-expanded').catch(() => 'false');
            if (expanded === 'true') {
                // Strategy 2: Check if any option items are visible within container
                const container = buildPlaywrightLocator(page, containerSelector).first();
                const optionCount = await container
                    .locator(CUSTOM_OPTION_SELECTORS)
                    .count()
                    .catch(() => 0);
                if (optionCount > 0) {
                    const visibleCount = await container
                        .locator(CUSTOM_OPTION_SELECTORS)
                        .filter({ visible: true })
                        .count()
                        .catch(() => 0);
                    if (visibleCount > 0) return; // Menu is open with visible options
                }
                // Strategy 3: Check for portal options (attached to body)
                const portalCount = await page
                    .locator(CUSTOM_OPTION_SELECTORS)
                    .filter({ visible: true })
                    .count()
                    .catch(() => 0);
                if (portalCount > 0) return; // Portal menu is open
            }
        } catch {
            // Ignore and retry
        }
        await page.waitForTimeout(100);
    }
    // If we reach here, menu didn't fully open in time - but continue anyway
    console.warn('[CustomDropdown] Menu open timeout, proceeding with option resolution');
}

/**
 * Locates a custom dropdown option, preferring option-like items over raw text
 * matches so the trigger's visible label is never clicked instead.
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {Object} option
 * @param {number} timeout
 * @returns {Promise<import('playwright').Locator|null>}
 */
export async function resolveDropdownOptionLocator(
    page,
    containerSelector,
    option,
    timeout = 30000,
) {
    const text = option.label || option.value;

    const tryWaitVisible = async (locator) => {
        try {
            await locator.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
            return locator;
        } catch {
            return null;
        }
    };

    // First, ensure menu is open and options are present (especially for portal menus)
    if (containerSelector) {
        await waitForOptionsReady(page, containerSelector, text, timeout);
    }

    if (containerSelector) {
        const container = buildPlaywrightLocator(page, containerSelector).first();
        try {
            await container.waitFor({ state: 'attached', timeout: Math.min(timeout, 5000) });
        } catch {
            return null;
        }

        try {
            if (text) {
                const byRoleItem = container
                    .locator(CUSTOM_OPTION_SELECTORS)
                    .filter({ hasText: String(text) })
                    .first();
                const hitRole = await tryWaitVisible(byRoleItem);
                if (hitRole) return hitRole;

                const byText =
                    typeof container.getByText === 'function'
                        ? container.getByText(String(text), { exact: true }).first()
                        : null;
                if (byText) {
                    const hitText = await tryWaitVisible(byText);
                    if (hitText) return hitText;
                }
            } else if (option.locator && option.locator.trim()) {
                const viaLocator = buildPlaywrightLocator(page, option.locator).first();
                const hit = await tryWaitVisible(viaLocator);
                if (hit) return hit;
            } else {
                const first = container.locator(CUSTOM_OPTION_SELECTORS).first();
                const hit = await tryWaitVisible(first);
                if (hit) return hit;
            }
        } catch {
            // Container may not support the option-item APIs (unusual widgets);
            // fall through to page-wide resolution below.
        }
    } else if (option.locator && option.locator.trim()) {
        const viaLocator = buildPlaywrightLocator(page, option.locator).first();
        const hit = await tryWaitVisible(viaLocator);
        if (hit) return hit;
    }

    // Fallback for portals/overlays attached outside the container.
    if (text && typeof page.locator === 'function') {
        const pageOption = page
            .locator(CUSTOM_OPTION_SELECTORS)
            .filter({ hasText: String(text) })
            .first();
        const hit = await tryWaitVisible(pageOption);
        if (hit) return hit;
    }

    return null;
}

/**
 * Waits for dropdown options to be present in the DOM (inside container or portal).
 * Used after menu trigger click to ensure options are rendered before resolution.
 *
 * @param {import('playwright').Page} page
 * @param {string} containerSelector
 * @param {string} targetText - Text to match (option label/value)
 * @param {number} timeout
 */
async function waitForOptionsReady(page, containerSelector, targetText, timeout = 30000) {
    const startTime = Date.now();
    const maxWait = Math.min(timeout, 8000);
    const searchText = targetText || '';

    while (Date.now() - startTime < maxWait) {
        try {
            // Check inside container
            if (containerSelector) {
                const container = buildPlaywrightLocator(page, containerSelector).first();
                let count = 0;
                if (searchText) {
                    count = await container
                        .locator(CUSTOM_OPTION_SELECTORS)
                        .filter({ hasText: searchText })
                        .count()
                        .catch(() => 0);
                } else {
                    count = await container
                        .locator(CUSTOM_OPTION_SELECTORS)
                        .count()
                        .catch(() => 0);
                }
                if (count > 0) return;
            }

            // Check page-wide (portal)
            let portalCount = 0;
            if (searchText) {
                portalCount = await page
                    .locator(CUSTOM_OPTION_SELECTORS)
                    .filter({ hasText: searchText })
                    .count()
                    .catch(() => 0);
            } else {
                portalCount = await page
                    .locator(CUSTOM_OPTION_SELECTORS)
                    .count()
                    .catch(() => 0);
            }
            if (portalCount > 0) return;
        } catch {
            // Ignore and retry
        }
        await page.waitForTimeout(50);
    }
    console.warn('[CustomDropdown] Options not ready within timeout, proceeding anyway');
}

/**
 * Reads option state for custom dropdown items (aria-selected / class-based,
 * since those elements are not native <select> controls).
 *
 * @param {import('playwright').Locator} locator
 * @returns {Promise<boolean|null>}
 */
export async function readDropdownOptionState(locator) {
    try {
        return await locator.evaluate((el) => {
            if (el.matches('input[type="checkbox"]')) return el.checked;
            const ariaSelected = el.getAttribute('aria-selected');
            if (ariaSelected !== null) return ariaSelected === 'true';
            const ariaChecked = el.getAttribute('aria-checked');
            if (ariaChecked !== null) return ariaChecked === 'true';
            return (
                el.classList.contains('selected') ||
                el.classList.contains('active') ||
                el.classList.contains('is-selected')
            );
        });
    } catch {
        return null;
    }
}

/**
 * Executes the click-to-open + click-by-label selection flow for a custom
 * dropdown on behalf of a strategy.
 *
 * @param {import('../InteractionStrategy.js').BaseStrategy} strategy
 * @param {Object} params
 * @param {import('playwright').Page} params.page
 * @param {string} params.containerSelector
 * @param {Object[]} params.selections
 * @param {Object[]} params.detectedOptions
 * @param {number} params.timeout
 * @param {Object} params.runOptions
 * @returns {Promise<{applied: Object[], evidence: Object[], actionCount: number, optionCount: number}>}
 */
export async function selectFromCustomDropdown(
    strategy,
    { page, containerSelector, selections, detectedOptions, timeout, runOptions },
) {
    const evidence = [];
    const applied = [];
    let actionCount = 0;

    await openDropdownMenu(page, containerSelector, timeout);

    for (const sel of selections) {
        const option = strategy.findOption(detectedOptions, sel);

        if (!option) {
            evidence.push({
                label: sel.label,
                value: sel.value,
                type: 'select',
                before: 'Unknown',
                action: 'SELECT',
                after: null,
                result: 'FAIL',
                message: `Option "${sel.label || sel.value}" not found in detected options`,
            });
            continue;
        }

        const before = option.selected === true || option.checked === true;

        if (before) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Selected',
                action: 'SELECT',
                after: 'Selected',
                result: 'PASS',
                message: 'Already selected. No interaction performed.',
            });
            continue;
        }

        if (option.enabled === false) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Unselected',
                action: 'SELECT',
                after: null,
                result: 'FAIL',
                message: `Option "${option.label}" is disabled and cannot be selected.`,
            });
            throw new Error(`Option "${option.label}" is disabled and cannot be selected.`);
        }

        const optionLocator = await resolveDropdownOptionLocator(
            page,
            containerSelector,
            option,
            timeout,
        );
        if (!optionLocator) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Unselected',
                action: 'SELECT',
                after: null,
                result: 'FAIL',
                message: 'Could not resolve locator for option',
            });
            throw new Error(
                `Could not resolve locator for option "${option.label}" in custom dropdown`,
            );
        }

        try {
            await optionLocator.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
            await optionLocator.click(runOptions);

            applied.push({
                label: option.label,
                value: option.value,
                type: option.type,
                action: 'SELECT',
                selected: true,
            });
            actionCount++;

            await strategy.safeWait(page, 100);

            const after = await readDropdownOptionState(optionLocator);
            const pass = after === true;

            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Unselected',
                action: 'SELECT',
                after: after ? 'Selected' : after === false ? 'Unselected' : 'Unknown',
                result: pass ? 'PASS' : 'FAIL',
                message: pass
                    ? null
                    : `Expected Selected but found ${after ? 'Selected' : after === false ? 'Unselected' : 'Unknown'}`,
            });
        } catch (err) {
            evidence.push({
                label: option.label,
                value: option.value,
                type: option.type,
                before: 'Unselected',
                action: 'SELECT',
                after: null,
                result: 'FAIL',
                message: err.message,
            });
            throw new Error(
                `Failed to select option "${option.label}" from custom dropdown: ${err.message}`,
            );
        }
    }

    return { applied, evidence, actionCount, optionCount: detectedOptions.length };
}

/**
 * Best-effort recovery when selectOption() fails: reopen the menu and click the
 * option by label/text.
 *
 * @param {import('../InteractionStrategy.js').BaseStrategy} strategy
 * @param {Object} params
 * @returns {Promise<boolean>} true if the option was successfully clicked
 */
export async function tryCustomDropdownRecovery(
    strategy,
    { page, containerSelector, option, timeout, runOptions },
) {
    try {
        await openDropdownMenu(page, containerSelector, timeout);
        const locator = await resolveDropdownOptionLocator(
            page,
            containerSelector,
            option,
            timeout,
        );
        if (!locator) return false;
        await locator.waitFor({ state: 'visible', timeout: Math.min(timeout, 5000) });
        await locator.click(runOptions);
        await strategy.safeWait(page, 100);
        return true;
    } catch {
        return false;
    }
}
