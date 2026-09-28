import { describe, it, expect, vi } from 'vitest';
import { givenHeadlessHost, givenDesktopHost, givenHost } from './helpers/display.js';

vi.mock('playwright', () => ({
    chromium: { launch: vi.fn() },
    firefox: { launch: vi.fn() },
    webkit: { launch: vi.fn() },
}));

vi.mock('../config/paths.js', () => ({
    STORAGE_DIR: '/tmp/test-storage',
    STORAGE_RUNS_DIR: '/tmp/test-storage/runs',
}));

import { canRunHeaded, describeDisplay } from '../core/display-utils.js';

describe('canRunHeaded', () => {
    it('is false on linux without DISPLAY or WAYLAND_DISPLAY', () => {
        givenHeadlessHost();
        expect(canRunHeaded()).toBe(false);
    });

    it('is true on linux with DISPLAY', () => {
        givenHost({ display: ':0' });
        expect(canRunHeaded()).toBe(true);
    });

    it('is true on linux with WAYLAND_DISPLAY only', () => {
        givenHost({ wayland: 'wayland-0' });
        expect(canRunHeaded()).toBe(true);
    });

    it.each(['darwin', 'win32'])('is true on %s regardless of env', (platform) => {
        givenHost({ platform });
        expect(canRunHeaded()).toBe(true);
    });
});

describe('describeDisplay', () => {
    it('reports the display env vars and capability for a headless host', () => {
        givenHeadlessHost();
        expect(describeDisplay()).toEqual({
            headedSupported: false,
            DISPLAY: null,
            WAYLAND_DISPLAY: null,
        });
    });

    it('reports the display env vars and capability for a desktop host', () => {
        givenDesktopHost();
        expect(describeDisplay()).toEqual({
            headedSupported: true,
            DISPLAY: ':0',
            WAYLAND_DISPLAY: null,
        });
    });
});
