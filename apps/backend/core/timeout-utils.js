/**
 * Normalizes a user-supplied timeout value.
 *
 * - Empty string, null, undefined, or non-numeric → `0`
 * - Valid number → `Number(value)`
 *
 * A value of `0` means "use the platform default" (Playwright's built-in
 * timeout or the node's own internal timeout). When passing to Playwright,
 * callers should **omit** the `timeout` key entirely when the value is `0`
 * so that Playwright's global/action-specific defaults take effect.
 *
 * @param {*} value - Raw value from node configuration.
 * @returns {number}
 */
export const normalizeTimeout = (value) => {
    if (value === undefined || value === null || value === '') return 0;
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
};

/**
 * Builds a Playwright-compatible options object that includes the `timeout`
 * key **only** when the user explicitly configured a value greater than `0`.
 * This lets Playwright fall back to its own defaults when the user leaves the
 * field empty.
 *
 * @param {number} timeout - Normalized timeout from {@link normalizeTimeout}.
 * @returns {{ timeout?: number }}
 */
export const playTimeout = (timeout) => (timeout > 0 ? { timeout } : {});
