import { describe, it, expect } from 'vitest';
import {
    normalizeValue,
    coerceComparisonPair,
    isBooleanTrueString,
    isBooleanFalseString,
} from '../../core/compare.js';

describe('normalizeValue', () => {
    it('keeps null/undefined', () => {
        expect(normalizeValue(null)).toBe(null);
        expect(normalizeValue(undefined)).toBe(undefined);
    });

    it('keeps booleans as-is', () => {
        expect(normalizeValue(true)).toBe(true);
        expect(normalizeValue(false)).toBe(false);
    });

    it('coerces numeric strings to numbers', () => {
        expect(normalizeValue('42')).toBe(42);
        expect(normalizeValue(' 42 ')).toBe(42);
        expect(normalizeValue('-3.14')).toBe(-3.14);
        expect(normalizeValue('.5')).toBe(0.5);
    });

    it('leaves non numeric strings untouched', () => {
        expect(normalizeValue('admin')).toBe('admin');
        expect(normalizeValue('')).toBe('');
    });

    it('leaves non-string, non-boolean values untouched', () => {
        expect(normalizeValue(42)).toBe(42);
        const obj = { a: 1 };
        expect(normalizeValue(obj)).toBe(obj);
    });
});

describe('coerceComparisonPair', () => {
    it('coerces numeric string against a number', () => {
        expect(coerceComparisonPair(10, '12')).toEqual({ left: 10, right: 12 });
        expect(coerceComparisonPair('12', 10)).toEqual({ left: 12, right: 10 });
    });

    it('normalizes boolean-like strings against a boolean', () => {
        expect(coerceComparisonPair(true, 'success')).toEqual({ left: true, right: true });
        expect(coerceComparisonPair(false, 'error')).toEqual({ left: false, right: false });
        expect(coerceComparisonPair('true', false)).toEqual({ left: true, right: false });
    });

    it('returns operands unchanged when types already align', () => {
        expect(coerceComparisonPair('admin', 'admin')).toEqual({
            left: 'admin',
            right: 'admin',
        });
        expect(coerceComparisonPair(1, 2)).toEqual({ left: 1, right: 2 });
    });
});

describe('boolean string helpers', () => {
    it('recognizes true-like strings', () => {
        expect(isBooleanTrueString('true')).toBe(true);
        expect(isBooleanTrueString('success')).toBe(true);
        expect(isBooleanTrueString('TRUE')).toBe(true);
        expect(isBooleanTrueString('false')).toBe(false);
    });

    it('recognizes false-like strings', () => {
        expect(isBooleanFalseString('false')).toBe(true);
        expect(isBooleanFalseString('error')).toBe(true);
        expect(isBooleanFalseString('fail')).toBe(true);
        expect(isBooleanFalseString('true')).toBe(false);
    });
});
