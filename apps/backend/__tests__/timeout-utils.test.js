import { describe, it, expect } from 'vitest';
import { normalizeTimeout, playTimeout } from '../core/timeout-utils.js';

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
