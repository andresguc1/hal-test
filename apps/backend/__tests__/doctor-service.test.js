import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('playwright', () => ({
    chromium: { launch: vi.fn() },
    firefox: { launch: vi.fn() },
    webkit: { launch: vi.fn() },
}));

vi.mock('../config/paths.js', () => ({
    STORAGE_DIR: '/tmp/test-storage',
    STORAGE_RUNS_DIR: '/tmp/test-storage/runs',
}));

describe('DoctorService - display server report', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
    let doctorService;

    beforeEach(async () => {
        vi.resetModules();
        vi.stubEnv('DISPLAY', undefined);
        vi.stubEnv('WAYLAND_DISPLAY', undefined);
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true });
        ({ doctorService } = await import('../services/DoctorService.js'));
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        Object.defineProperty(process, 'platform', originalPlatform);
    });

    it('reports headed mode unsupported and explains it when no display is available', () => {
        const report = doctorService.check();

        expect(report.display.headedSupported).toBe(false);
        expect(report.display.DISPLAY).toBeNull();
        expect(report.guidance.some((line) => line.includes('headless'))).toBe(true);
    });

    it('reports headed mode supported when DISPLAY is set', async () => {
        vi.stubEnv('DISPLAY', ':99');
        vi.resetModules();
        ({ doctorService } = await import('../services/DoctorService.js'));

        const report = doctorService.check();

        expect(report.display.headedSupported).toBe(true);
        expect(report.display.DISPLAY).toBe(':99');
        expect(report.guidance.some((line) => line.includes('headless'))).toBe(false);
    });
});
