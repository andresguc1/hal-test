/**
 * Shared checkbox helpers for SetCheckboxAction.
 *
 * Extracted from the handler so the resolution chain and the apply/verify
 * logic can be unit-tested without a real browser.
 */

import { normalizeTimeout, playTimeout } from '../../../core/timeout-utils.js';

export const actionLabel = (action) => (action === 'uncheck' ? 'unchecked' : 'checked');

/** Escapes a string into a safe XPath string literal. */
const escapeXPathLiteral = (str) => {
    if (!str.includes("'")) return `'${str}'`;
    return `concat(${str
        .split("'")
        .map((p) => `'${p}'`)
        .join(', "\'", ')})`;
};

export const readChecked = async (locator) =>
    locator
        .isChecked()
        .catch(async () =>
            locator.evaluate(
                (el) => el.getAttribute('aria-checked') === 'true' || el.checked === true,
            ),
        );

export const readState = async (locator) => {
    const checked = await readChecked(locator);
    return checked ? 'checked' : 'unchecked';
};

export const waitSettle = (page) => {
    if (page && typeof page.waitForTimeout === 'function') {
        return page.waitForTimeout(50).catch(() => {});
    }
    return Promise.resolve();
};

/**
 * Verifies that a locator reaches the expected checked state, polling until
 * the assertion holds or the timeout elapses (Playwright-style auto-retry,
 * equivalent to expect(locator).toBeChecked({ checked })). A timeout of `0`
 * falls back to a 5000ms window (Playwright's default expect timeout).
 *
 * @returns {Promise<'checked'|'unchecked'>} the confirmed live state.
 * @throws {Error} when the state never matches within the window.
 */
export const assertCheckedState = async (locator, expectedChecked, { timeout = 0 } = {}) => {
    const windowMs = normalizeTimeout(timeout) || 5000;
    const deadline = Date.now() + windowMs;
    let checked = null;
    let lastError = null;

    do {
        try {
            checked = await readChecked(locator);
            lastError = null;
        } catch (err) {
            lastError = err;
            checked = null;
        }
        if (checked === expectedChecked) {
            return checked ? 'checked' : 'unchecked';
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    } while (Date.now() < deadline);

    const actual = checked === null ? 'not readable' : checked ? 'checked' : 'unchecked';
    throw new Error(
        lastError
            ? `Checkbox state could not be verified: ${lastError.message}`
            : `Checkbox state verification failed: expected ${
                  expectedChecked ? 'checked' : 'unchecked'
              } but got ${actual} after the action.`,
    );
};

/**
 * Applies check/uncheck/toggle over a single checkbox locator with one retry.
 * Returns the final live state ('checked' | 'unchecked').
 */
export const applyCheckbox = async (page, locator, action, { timeout } = {}) => {
    const runOptions = playTimeout(timeout);

    if (action === 'toggle') {
        await locator.click(runOptions);
        await waitSettle(page);
        return readState(locator);
    }

    const shouldCheck = action === 'check';
    const applyOnce = async () => {
        if (shouldCheck) {
            // check()/uncheck() only work on native inputs; [role=checkbox]
            // elements are toggled via click as a fallback.
            await locator.check(runOptions).catch(async () => {
                await locator.click(runOptions);
            });
        } else {
            await locator.uncheck(runOptions).catch(async () => {
                await locator.click(runOptions);
            });
        }
        await waitSettle(page);
        return readState(locator);
    };

    let state = await applyOnce();
    if (state !== actionLabel(action)) {
        // A JS handler may have re-inverted the state; retry once.
        state = await applyOnce();
    }
    return state;
};

/**
 * Resolves a checkbox by its visible label text. Tries, in order:
 *  1. Accessible name  (getByRole checkbox + name)    -> <label for>, aria-label
 *  2. Wrapping label    (label:has-text)              -> checkbox inside a <label>
 *  3. Adjacent text     (input whose first following
 *                        text node = target)          -> plain "□ checkbox 1"
 */
export const resolveLabelCheckbox = (page, target) => {
    const candidates = [
        () => page.getByRole('checkbox', { name: target, exact: true }),
        () =>
            page
                .locator(`label:has-text("${target}")`)
                .locator('input[type="checkbox"], [role="checkbox"]'),
        () =>
            page.locator(
                `xpath=//*[self::input[@type="checkbox"] or @role="checkbox"][normalize-space(following-sibling::text()[1]) = ${escapeXPathLiteral(target)}]`,
            ),
    ];

    return {
        candidates,
        source: `label: "${target}"`,
    };
};

/**
 * Tries every label candidate in order and returns the first one that matches
 * at least one element. Throws a descriptive error when nothing matches.
 */
export const findLabelCheckboxLocator = async (page, target) => {
    const { candidates, source } = resolveLabelCheckbox(page, target);
    for (const make of candidates) {
        const locator = make();
        const count = await locator.count().catch(() => 0);
        if (count > 0) {
            return { locator: locator.first(), source };
        }
    }
    throw new Error(
        `Checkbox not found for "${target}". Ensure it is wrapped in a <label>, uses aria-label, or the text sits right next to the checkbox.`,
    );
};
