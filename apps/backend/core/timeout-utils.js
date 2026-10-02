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

/**
 * Retry window for assertions whose own window is not Playwright's.
 *
 * Element assertions go through `expect()`, whose default is 5000 ms. The
 * assertion strategies in this engine poll themselves instead, and they
 * deliberately use a much shorter default: an assertion is usually written
 * against a state that is either already true or never going to be, so
 * waiting 5 s per failing check turns one broken step into a slow run. 500 ms
 * is still long enough for content that renders a frame or two late.
 *
 * This is HalTest's fast-fail default and it is intentionally not
 * Playwright's number. It lives here so the strategies and the frontend
 * capability registry quote the same figure instead of each carrying a
 * literal.
 */
export const DEFAULT_ASSERTION_WINDOW_MS = 500;

/**
 * Resolves the retry window for an assertion: the configured value when there
 * is one, otherwise {@link DEFAULT_ASSERTION_WINDOW_MS}.
 *
 * @param {number} timeout - Normalized timeout from {@link normalizeTimeout}.
 * @returns {number} A window in milliseconds, always greater than zero.
 */
export const assertionWindow = (timeout) =>
    normalizeTimeout(timeout) || DEFAULT_ASSERTION_WINDOW_MS;

/**
 * Resolves a timeout against a hard ceiling and an explicit fallback.
 *
 * Used for operations where "wait longer" is never the user's actual intent —
 * a wait on a condition that may never satisfy, or a browser that may never
 * start, produces a hung run rather than a slow one. The user's value applies
 * when it is smaller, so this only ever shortens.
 *
 * `fallbackMs` is required rather than defaulted, because the right value for
 * an unset timeout is a property of the operation: an assertion polls
 * itself and wants a short window, a network wait wants seconds. Guessing it
 * here would silently apply one operation's default to another's.
 *
 * @param {number} timeout - Normalized timeout from {@link normalizeTimeout}.
 * @param {number} ceiling - Maximum permitted value, in milliseconds.
 * @param {number} fallbackMs - Value used when `timeout` is 0.
 * @returns {number} A window in milliseconds, always greater than zero.
 */
export const clampTimeout = (timeout, ceiling, fallbackMs) =>
    Math.min(normalizeTimeout(timeout) || fallbackMs, ceiling);
