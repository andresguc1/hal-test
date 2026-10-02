import { describe, it, expect } from 'vitest';
import {
    normalizeTimeout,
    playTimeout,
    assertionWindow,
    clampTimeout,
    DEFAULT_ASSERTION_WINDOW_MS,
} from '../core/timeout-utils.js';

describe('normalizeTimeout', () => {
    it('returns 0 for undefined', () => {
        expect(normalizeTimeout(undefined)).toBe(0);
    });

    it('returns 0 for null', () => {
        expect(normalizeTimeout(null)).toBe(0);
    });

    it('returns 0 for empty string', () => {
        expect(normalizeTimeout('')).toBe(0);
    });

    it('returns 0 for whitespace-only string', () => {
        expect(normalizeTimeout('   ')).toBe(0);
    });

    it('returns 0 for NaN', () => {
        expect(normalizeTimeout(NaN)).toBe(0);
    });

    it('returns 0 for non-numeric strings', () => {
        expect(normalizeTimeout('abc')).toBe(0);
    });

    it('preserves numeric values', () => {
        expect(normalizeTimeout(0)).toBe(0);
        expect(normalizeTimeout(1)).toBe(1);
        expect(normalizeTimeout(5000)).toBe(5000);
    });

    it('coerces numeric strings', () => {
        expect(normalizeTimeout('30000')).toBe(30000);
        expect(normalizeTimeout('0')).toBe(0);
    });
});

describe('playTimeout', () => {
    it('omits the timeout option when value is 0', () => {
        expect(playTimeout(0)).toEqual({});
    });

    it('omits the timeout option when value is undefined/negative', () => {
        expect(playTimeout(undefined)).toEqual({});
        expect(playTimeout(-1)).toEqual({});
    });

    it('passes the timeout option when value is positive', () => {
        expect(playTimeout(5000)).toEqual({ timeout: 5000 });
        expect(playTimeout(30000)).toEqual({ timeout: 30000 });
    });
});

describe('DEFAULT_ASSERTION_WINDOW_MS', () => {
    it('is the fast-fail default used by strategies', () => {
        expect(DEFAULT_ASSERTION_WINDOW_MS).toBe(500);
    });
});

describe('assertionWindow', () => {
    it('returns the configured value when positive', () => {
        expect(assertionWindow(1000)).toBe(1000);
        expect(assertionWindow(5000)).toBe(5000);
    });

    it('returns the fast-fail default when zero or omitted', () => {
        expect(assertionWindow(0)).toBe(500);
        expect(assertionWindow(undefined)).toBe(500);
        expect(assertionWindow(null)).toBe(500);
        expect(assertionWindow('')).toBe(500);
    });

    it('coerces numeric strings', () => {
        expect(assertionWindow('2000')).toBe(2000);
        expect(assertionWindow('0')).toBe(500);
    });
});

describe('clampTimeout', () => {
    it('applies the configured value when smaller than the ceiling', () => {
        expect(clampTimeout(10000, 50000, 30000)).toBe(10000);
    });

    it('uses the fallback when timeout is zero', () => {
        expect(clampTimeout(0, 50000, 30000)).toBe(30000);
    });

    it('uses the fallback when timeout is omitted', () => {
        expect(clampTimeout(undefined, 50000, 30000)).toBe(30000);
    });

    it('clamps to the ceiling when configured value exceeds it', () => {
        expect(clampTimeout(100000, 50000, 30000)).toBe(50000);
    });

    it('honours the ceiling even when the fallback is larger', () => {
        expect(clampTimeout(0, 50000, 100000)).toBe(50000);
    });
});
