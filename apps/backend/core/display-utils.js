/**
 * Display-server detection.
 *
 * Playwright can only open a visible (headed) window when the host has a
 * display server. Cloud hosts and Docker images run Linux without one, so a
 * headed launch there always dies with "you launched a headed browser without
 * having a XServer running".
 *
 * This module is deliberately dependency-free: it must stay importable from
 * diagnostics (DoctorService) without dragging in Playwright or the whole
 * BrowserManager.
 */

/** @returns {boolean} true when this host can open a visible browser window. */
export function canRunHeaded() {
    if (process.platform !== 'linux') return true;
    return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
}

/**
 * Display state for the `/api/doctor` report.
 * @returns {{headedSupported: boolean, DISPLAY: string|null, WAYLAND_DISPLAY: string|null}}
 */
export function describeDisplay() {
    return {
        headedSupported: canRunHeaded(),
        DISPLAY: process.env.DISPLAY || null,
        WAYLAND_DISPLAY: process.env.WAYLAND_DISPLAY || null,
    };
}
