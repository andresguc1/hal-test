import { afterEach, vi } from 'vitest';

/**
 * Test helpers to pin the host's display-server capability.
 *
 * `resolveHeadlessPolicy` reads `process.platform` and the DISPLAY /
 * WAYLAND_DISPLAY env vars at call time, so headless-policy tests must state
 * which host they are running against instead of inheriting the developer's
 * desktop.
 */

const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

/**
 * Simulate a host with the given platform and display server.
 * @param {{platform?: string, display?: string|null, wayland?: string|null}} host
 */
export function givenHost({ platform = 'linux', display = null, wayland = null } = {}) {
    Object.defineProperty(process, 'platform', { value: platform, configurable: true });
    vi.stubEnv('DISPLAY', display ?? undefined);
    vi.stubEnv('WAYLAND_DISPLAY', wayland ?? undefined);
}

/** A Linux desktop host: headed browsers work. */
export const givenDesktopHost = (platform = 'linux') => givenHost({ platform, display: ':0' });

/** A headless cloud/Docker host: headed browsers cannot open a window. */
export const givenHeadlessHost = () => givenHost({ platform: 'linux' });

/** Restores `process.platform` and un-stubs the display env vars. */
afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(process, 'platform', originalPlatform);
});
