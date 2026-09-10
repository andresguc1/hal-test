/**
 * InteractionStrategy
 *
 * Registry and base interface for component interaction strategies.
 * Each strategy knows how to detect, execute, and verify selections
 * for a specific component type (select, checkbox, radio, combobox, etc.)
 */

import { buildPlaywrightLocator, normalizeSelectorForDotId } from '../core/selector-utils.js';

/**
 * @typedef {Object} StrategyContext
 * @property {import('playwright').Page} page
 * @property {string} containerSelector
 * @property {Object[]} selectedOptions - User configured actions [{label, value, action}]
 * @property {Object[]} detectedOptions - All detected options with locators, types, states
 * @property {number} timeout
 * @property {boolean} menuOpen - Whether menu is already open (for custom dropdowns)
 */

/**
 * @typedef {Object} StrategyResult
 * @property {Object[]} applied - Successfully applied selections
 * @property {Object[]} evidence - Per-option PASS/FAIL evidence
 * @property {number} actionCount - Number of interactions performed
 * @property {number} optionCount - Total options detected
 */

/**
 * Base interface for all interaction strategies.
 */
export class BaseStrategy {
    /**
     * Whether this strategy requires opening a menu/trigger before selecting.
     * @type {boolean}
     */
    get requiresMenuOpen() {
        return false;
    }

    /**
     * Whether this strategy supports multi-selection.
     * @type {boolean}
     */
    get supportsMultiSelect() {
        return false;
    }

    /**
     * Detects options within a container.
     * Default implementation uses the global detectOptions script.
     * Can be overridden for strategy-specific detection (e.g., combobox popup).
     *
     * @param {import('playwright').Page} page
     * @param {string} containerSelector
     * @param {number} timeout
     * @returns {Promise<Object[]>} Array of detected options
     */
    async detect(page, containerSelector, timeout = 30000) {
        const { detectOptions } = await import('./OptionDetector.js');
        const result = await detectOptions(page, containerSelector, { timeout });
        return result.options || [];
    }

    /**
     * Executes the selection actions for this strategy.
     * Must be implemented by subclasses.
     *
     * @param {StrategyContext} ctx
     * @returns {Promise<StrategyResult>}
     */
    async execute(_ctx) {
        throw new Error('execute() must be implemented by subclass');
    }

    /**
     * Verifies the state after execution.
     * Default implementation re-reads state for each option.
     *
     * @param {StrategyContext} ctx
     * @returns {Promise<Object[]>} Updated options with verified states
     */
    async verify(ctx) {
        const { page, containerSelector, detectedOptions, timeout } = ctx;
        const results = [];

        for (const option of detectedOptions) {
            const target = await this.buildTargetLocator(page, option, containerSelector, {
                timeout,
            });
            if (!target) {
                results.push({
                    ...option,
                    _verified: false,
                    _verifyError: 'Locator resolution failed',
                });
                continue;
            }

            try {
                let state = null;
                if (option.type === 'native_select' || option.type === 'native_select_multi') {
                    state = await target.evaluate((el) => el.selected).catch(() => null);
                } else if (option.type === 'checkbox' || option.type === 'radio') {
                    state = await target.isChecked().catch(() => null);
                } else {
                    state = await target
                        .evaluate((el) => {
                            if (el.matches('input[type="checkbox"], input[type="radio"]'))
                                return el.checked;
                            const ariaChecked = el.getAttribute('aria-checked');
                            if (ariaChecked !== null) return ariaChecked === 'true';
                            const ariaSelected = el.getAttribute('aria-selected');
                            if (ariaSelected !== null) return ariaSelected === 'true';
                            return (
                                el.classList.contains('selected') ||
                                el.classList.contains('active') ||
                                el.classList.contains('is-selected')
                            );
                        })
                        .catch(() => null);
                }
                results.push({ ...option, _verified: true, _verifiedState: state });
            } catch (err) {
                results.push({ ...option, _verified: false, _verifyError: err.message });
            }
        }

        return results;
    }

    /**
     * Builds a Playwright locator for an option within its container.
     *
     * @param {import('playwright').Page} page
     * @param {Object} option
     * @param {string} containerSelector
     * @param {Object} options
     * @returns {Promise<import('playwright').Locator|null>}
     */
    async buildTargetLocator(page, option, containerSelector, options = {}) {
        const timeout = options.timeout || 30000;

        // Absolute-id locators (e.g. `#checkbox-1`) are unique in the document,
        // so a container-relative chain (`#checkboxes >> #checkbox-1`) fails
        // silently whenever the element is NOT a descendant of the container at
        // execution time (portals/overlays, re-rendered lists, or a container
        // `.first()` matching a different node). Resolve those globally with a
        // clear error instead of letting check()/uncheck() block a whole timeout.
        if (option.locator && /^#[\w-]+$/.test(option.locator.trim())) {
            try {
                return await this.#resolveAbsoluteId(
                    page,
                    option,
                    containerSelector,
                    option.locator.trim(),
                    timeout,
                );
            } catch (err) {
                // The absolute id may be synthetic/non-existent in the DOM while the
                // option is still reachable by its position inside the container.
                // Retry with a relative index locator before giving up, so actions
                // on such options don't abort with an unresolvable id.
                const fallback = await this.#resolveRelativeByIndex(
                    page,
                    option,
                    containerSelector,
                    timeout,
                );
                if (fallback) {
                    console.warn(
                        `[Strategy] Absolute locator "${option.locator}" failed (${err.message}); retrying by index.`,
                    );
                    return fallback;
                }
                throw err;
            }
        }

        if (option.locator) {
            try {
                // Check if locator is a Playwright locator method string (getByRole, getByText, getByLabel, etc.)
                const isPlaywrightLocator =
                    /^getBy(Role|Text|Label|TestId|Placeholder|AltText|Title)/.test(
                        option.locator.trim(),
                    );

                if (isPlaywrightLocator) {
                    // Evaluate the Playwright locator method on the page or container
                    if (containerSelector) {
                        const container = await normalizeSelectorForDotId(page, containerSelector);
                        const containerLocator = buildPlaywrightLocator(page, container).first();
                        await containerLocator.waitFor({ state: 'attached', timeout });

                        // Extract the method and arguments from the locator string
                        // e.g., "getByRole('checkbox', { name: 'checkbox 2' })"
                        const match = option.locator.match(/^getBy(\w+)\((.*)\)$/);
                        if (match) {
                            const methodName = 'getBy' + match[1];
                            const args = match[2];
                            try {
                                // Use Function constructor to safely evaluate the locator method
                                // This is safe because the locator comes from our own detection code
                                const locatorFn = new Function(
                                    'page',
                                    'container',
                                    'args',
                                    `return container.${methodName}(args);`,
                                );
                                return locatorFn(page, containerLocator, args).first();
                            } catch (e) {
                                console.warn(
                                    '[Strategy] Failed to evaluate Playwright locator:',
                                    e.message,
                                );
                            }
                        }
                        // Fallback: try to use the locator as a CSS selector within container
                        return containerLocator.locator(option.locator).first();
                    } else {
                        // No container - use page directly
                        const match = option.locator.match(/^getBy(\w+)\((.*)\)$/);
                        if (match) {
                            const methodName = 'getBy' + match[1];
                            const args = match[2];
                            try {
                                const locatorFn = new Function(
                                    'page',
                                    'args',
                                    `return page.${methodName}(args);`,
                                );
                                return locatorFn(page, args).first();
                            } catch (e) {
                                console.warn(
                                    '[Strategy] Failed to evaluate Playwright locator on page:',
                                    e.message,
                                );
                            }
                        }
                        return buildPlaywrightLocator(page, option.locator).first();
                    }
                }

                // Standard CSS selector path
                if (containerSelector) {
                    const container = await normalizeSelectorForDotId(page, containerSelector);
                    const containerLocator = buildPlaywrightLocator(page, container).first();
                    await containerLocator.waitFor({ state: 'attached', timeout });
                    return containerLocator.locator(option.locator).first();
                }
                return buildPlaywrightLocator(page, option.locator).first();
            } catch (err) {
                console.warn('[Strategy] locator resolution failed, falling back:', err.message);
            }
        }

        return this.#resolveRelativeByIndex(page, option, containerSelector, timeout);
    }

    /**
     * Resolves an option by its position (index) inside the container using a
     * type-appropriate relative chain. This is the most resilient fallback when
     * no absolute id or named locator exists (e.g. "bare" checkboxes/radios or
     * synthetic ids that never exist in the DOM).
     *
     * @param {import('playwright').Page} page
     * @param {Object} option
     * @param {string} containerSelector
     * @param {number} timeout
     * @returns {Promise<import('playwright').Locator|null>}
     */
    async #resolveRelativeByIndex(page, option, containerSelector, timeout = 30000) {
        if (!containerSelector) return null;

        const container = await normalizeSelectorForDotId(page, containerSelector);
        const containerLocator = buildPlaywrightLocator(page, container).first();
        await containerLocator.waitFor({ state: 'attached', timeout });

        const count = option.index ?? 0;
        if (option.type === 'native_select' || option.type === 'native_select_multi') {
            return containerLocator.locator('option').nth(count);
        }
        if (option.type === 'checkbox' || option.type === 'aria_checkbox') {
            return containerLocator.locator('input[type="checkbox"], [role="checkbox"]').nth(count);
        }
        if (option.type === 'radio' || option.type === 'aria_radio') {
            return containerLocator.locator('input[type="radio"], [role="radio"]').nth(count);
        }
        if (option.type === 'aria_option') {
            return containerLocator.locator('[role="option"]').nth(count);
        }
        return containerLocator.locator('*').nth(count);
    }

    /**
     * Resolves an absolute-id locator (`#checkbox-1`) for an option.
     *
     * Prefers the container-relative locator (cheapest and most precise when the
     * DOM matches detection). If the element is not a descendant of the container,
     * falls back to a document-global resolution so portal/overlay/moved elements
     * still work. Throws a descriptive error when the element cannot be found at
     * either scope, so callers don't block a full action timeout on a useless chain.
     *
     * @param {import('playwright').Page} page
     * @param {Object} option
     * @param {string} containerSelector
     * @param {string} idSelector
     * @param {number} timeout
     * @returns {Promise<import('playwright').Locator>}
     */
    async #resolveAbsoluteId(page, option, containerSelector, idSelector, timeout) {
        const globalTarget = buildPlaywrightLocator(page, idSelector).first();

        if (!containerSelector) {
            try {
                await globalTarget.waitFor({
                    state: 'attached',
                    timeout: Math.min(timeout, 5000),
                });
                return globalTarget;
            } catch {
                return null;
            }
        }

        let containerLocator = null;
        try {
            const container = await normalizeSelectorForDotId(page, containerSelector);
            containerLocator = buildPlaywrightLocator(page, container).first();
            await containerLocator.waitFor({ state: 'attached', timeout });
        } catch (err) {
            console.warn(
                `[Strategy] Container "${containerSelector}" not found while resolving option "${option.label}": ${err.message}`,
            );
        }

        if (containerLocator) {
            const inContainer = containerLocator.locator(idSelector).first();
            try {
                await inContainer.waitFor({ state: 'attached', timeout: Math.min(timeout, 2000) });
                return inContainer;
            } catch {
                // Element is not a descendant of the container - try globally.
            }
        }

        try {
            await globalTarget.waitFor({ state: 'attached', timeout: Math.min(timeout, 5000) });
            console.warn(
                `[Strategy] Option "${option.label}" locator "${idSelector}" resolved globally but is not a descendant of container "${containerSelector}"`,
            );
            return globalTarget;
        } catch {
            throw new Error(
                `Option "${option.label}" locator "${idSelector}" not found inside container "${containerSelector}" nor globally in the page.`,
            );
        }
    }

    /**
     * Normalizes user action to canonical form.
     *
     * @param {string} action
     * @returns {'NO_CHANGE'|'CHECK'|'UNCHECK'|'SELECT'}
     */
    normalizeAction(action) {
        const a = String(action || 'CHECK')
            .toUpperCase()
            .trim();
        if (['NO_CHANGE', 'CHECK', 'UNCHECK', 'SELECT'].includes(a)) return a;
        return 'CHECK';
    }

    /**
     * Safely waits for a short time if page.waitForTimeout is available.
     * @param {import('playwright').Page} page
     * @param {number} ms
     */
    async safeWait(page, ms = 50) {
        if (page && typeof page.waitForTimeout === 'function') {
            try {
                await page.waitForTimeout(ms);
            } catch {
                // ignore
            }
        }
    }

    /**
     * Validates UNCHECK action for the given option type.
     * Override in subclasses to provide type-specific validation.
     * @param {string} action
     * @param {Object} option
     * @throws {Error} if UNCHECK is not supported
     */
    validateUncheck(_action, _option) {
        // Default: allow UNCHECK
    }

    /**
     * Finds a detected option matching the user's selection config.
     *
     * @param {Object[]} detectedOptions
     * @param {Object} selection - {label, value, action}
     * @returns {Object|null}
     */
    findOption(detectedOptions, selection) {
        if (!selection || typeof selection !== 'object') return null;
        const query = selection.label ?? selection.value;
        if (query === undefined || query === null || query === '') return null;
        const lower = String(query).toLowerCase();

        return (
            detectedOptions.find((o) => o.label && String(o.label).toLowerCase() === lower) ||
            detectedOptions.find(
                (o) => o.value !== undefined && String(o.value).toLowerCase() === lower,
            ) ||
            detectedOptions.find((o) => o.label && String(o.label).toLowerCase().includes(lower))
        );
    }

    /**
     * Reads current checked/selected state from DOM.
     *
     * @param {import('playwright').Locator} target
     * @param {Object} option
     * @returns {Promise<boolean|null>}
     */
    async readState(target, option) {
        try {
            if (option.type === 'native_select' || option.type === 'native_select_multi') {
                return await target.evaluate((el) => el.selected);
            }
            if (option.type === 'checkbox' || option.type === 'radio') {
                return await target.isChecked();
            }
            return await target.evaluate((el) => {
                if (el.matches('input[type="checkbox"], input[type="radio"]')) return el.checked;
                const ariaChecked = el.getAttribute('aria-checked');
                if (ariaChecked !== null) return ariaChecked === 'true';
                const ariaSelected = el.getAttribute('aria-selected');
                if (ariaSelected !== null) return ariaSelected === 'true';
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
}

/**
 * Strategy registry.
 * @type {Map<string, typeof BaseStrategy>}
 */
const strategyRegistry = new Map();

/**
 * Registers a strategy class for a group type.
 *
 * @param {string} groupType - e.g., 'select', 'checkbox-group', 'combobox'
 * @param {typeof BaseStrategy} StrategyClass
 */
export function registerStrategy(groupType, StrategyClass) {
    if (!(StrategyClass.prototype instanceof BaseStrategy)) {
        throw new Error(`StrategyClass must extend BaseStrategy`);
    }
    strategyRegistry.set(groupType, StrategyClass);
}

/**
 * Gets the strategy instance for a group type.
 *
 * @param {string} groupType
 * @returns {BaseStrategy}
 */
export function getStrategy(groupType) {
    const StrategyClass = strategyRegistry.get(groupType);
    if (!StrategyClass) {
        console.warn(
            `[InteractionStrategy] No strategy for "${groupType}", falling back to CustomComponentStrategy`,
        );
        const FallbackClass = strategyRegistry.get('custom') || BaseStrategy;
        return new FallbackClass();
    }
    return new StrategyClass();
}

/**
 * Gets all registered group types.
 *
 * @returns {string[]}
 */
export function getRegisteredGroupTypes() {
    return Array.from(strategyRegistry.keys());
}

/**
 * Checks if a group type has a registered strategy.
 *
 * @param {string} groupType
 * @returns {boolean}
 */
export function hasStrategy(groupType) {
    return strategyRegistry.has(groupType);
}

export default {
    registerStrategy,
    getStrategy,
    getRegisteredGroupTypes,
    hasStrategy,
    BaseStrategy,
};
