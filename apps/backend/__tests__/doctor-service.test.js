import { describe, it, expect, vi, beforeEach } from 'vitest';
import { givenHeadlessHost, givenHost } from './helpers/display.js';

vi.mock('../config/paths.js', () => ({
    STORAGE_DIR: '/tmp/test-storage',
    STORAGE_RUNS_DIR: '/tmp/test-storage/runs',
}));

describe('DoctorService - display report', () => {
    let DoctorService;

    beforeEach(async () => {
        // check() caches its report per instance, so re-import for a fresh one.
        vi.resetModules();
        ({ DoctorService } = await import('../services/DoctorService.js'));
    });

    it('reports headed mode unsupported and explains it when no display is available', () => {
        givenHeadlessHost();

        const report = new DoctorService().check();

        expect(report.display).toEqual({
            headedSupported: false,
            DISPLAY: null,
            WAYLAND_DISPLAY: null,
        });
        expect(report.guidance.some((line) => line.includes('headless'))).toBe(true);
    });

    it('reports headed mode supported and omits the guidance when DISPLAY is set', () => {
        givenHost({ display: ':99' });

        const report = new DoctorService().check();

        expect(report.display).toEqual({
            headedSupported: true,
            DISPLAY: ':99',
            WAYLAND_DISPLAY: null,
        });
        expect(report.guidance.some((line) => line.includes('headless'))).toBe(false);
    });
});
